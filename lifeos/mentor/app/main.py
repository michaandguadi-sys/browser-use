"""FastAPI app: passphrase login, chat, memory, settings, PWA static files, health."""

import asyncio
import hmac
import json
import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal
from zoneinfo import available_timezones

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

from app.config import Config, load_config
from app.db import DB
from app.llm import LLM, ClaudeLLM
from app.mentor import Mentor
from app.notify import Notifier
from app.scheduler import Scheduler
from app.timing import parse_iso
from app.views import MemoryKind, Settings

logger = logging.getLogger(__name__)
STATIC_DIR = Path(__file__).parent / 'static'
LOGIN_WINDOW_SECONDS, LOGIN_MAX_FAILURES = 900, 10


class LoginIn(BaseModel):
	passphrase: str


class MessageIn(BaseModel):
	text: str = Field(min_length=1, max_length=20000)


class FeedbackIn(BaseModel):
	value: Literal[-1, 0, 1]


class MemoryIn(BaseModel):
	kind: MemoryKind
	text: str = Field(min_length=1, max_length=2000)
	due_at: str | None = None


class MemoryPatch(BaseModel):
	text: str | None = Field(default=None, min_length=1, max_length=2000)
	status: Literal['active', 'done', 'dropped'] | None = None
	due_at: str | None = None


class FocusIn(BaseModel):
	minutes: int = Field(ge=0, le=60 * 24 * 14)  # 0 ends focus mode


def load_seed(db: DB, seed_path: str) -> None:
	"""Load starter memory once, on an empty database."""
	if not seed_path or db.memory_count() > 0 or not Path(seed_path).is_file():
		return
	for item in json.loads(Path(seed_path).read_text()):
		db.add_memory(item['kind'], item['text'], source='seed')
	logger.info('loaded seed memory from %s', seed_path)


def create_app(config: Config, llm: LLM | None = None, run_scheduler: bool = True) -> FastAPI:
	db = DB(config.db_path)
	load_seed(db, config.seed_path)
	mentor = Mentor(db, llm or ClaudeLLM(config.anthropic_api_key, config.model), config.owner_name)
	notifier = Notifier(config)
	scheduler = Scheduler(db, mentor, notifier, config.tick_seconds, config.healthcheck_ping_url)
	failures: dict[str, list[float]] = defaultdict(list)

	@asynccontextmanager
	async def lifespan(app: FastAPI):
		task = asyncio.create_task(scheduler.run_forever()) if run_scheduler else None
		yield
		if task:
			task.cancel()

	app = FastAPI(title='Life OS Mentor', lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
	app.add_middleware(
		SessionMiddleware,
		secret_key=config.session_secret,
		session_cookie='mentor_session',
		max_age=60 * 60 * 24 * 90,
		same_site='lax',
		https_only=config.cookie_secure,
	)
	app.state.db, app.state.mentor, app.state.scheduler = db, mentor, scheduler

	def require_auth(request: Request) -> None:
		if not request.session.get('auth') or request.session.get('epoch') != db.session_epoch():
			raise HTTPException(status_code=401, detail='login required')
		tz = request.headers.get('x-timezone', '')
		if tz and tz in available_timezones() and tz != db.get_settings().timezone:
			db.update_settings(timezone=tz)  # follow the phone/laptop clock as you travel

	auth = [Depends(require_auth)]

	@app.post('/api/login')
	async def login(body: LoginIn, request: Request):
		ip = request.client.host if request.client else '?'
		now = time.monotonic()
		failures[ip] = [t for t in failures[ip] if now - t < LOGIN_WINDOW_SECONDS]
		if len(failures[ip]) >= LOGIN_MAX_FAILURES:
			raise HTTPException(status_code=429, detail='too many attempts, wait 15 minutes')
		if not hmac.compare_digest(body.passphrase.encode(), config.passphrase.encode()):
			failures[ip].append(now)
			raise HTTPException(status_code=401, detail='wrong passphrase')
		request.session['auth'] = True
		request.session['epoch'] = db.session_epoch()
		return {'ok': True}

	@app.post('/api/logout')
	async def logout(request: Request):
		if request.session.get('auth') and request.session.get('epoch') == db.session_epoch():
			db.bump_session_epoch()  # server-side revocation: copied cookies stop working too
		request.session.clear()
		return {'ok': True}

	@app.get('/api/state', dependencies=auth)
	async def state():
		return {
			'owner': config.owner_name,
			'messages': [m.model_dump() for m in db.recent_messages(200)],
			'memory': [m.model_dump() for m in db.list_memory(include_done=True)],
			'settings': db.get_settings().model_dump(),
			'push': {'enabled': notifier.enabled, 'server': config.ntfy_public_url, 'topic': config.ntfy_topic},
		}

	@app.post('/api/message', dependencies=auth)
	async def message(body: MessageIn):
		user_msg, mentor_msg, added = await mentor.reply(body.text)
		return {'user': user_msg.model_dump(), 'mentor': mentor_msg.model_dump(), 'memory_added': [m.model_dump() for m in added]}

	@app.post('/api/messages/{msg_id}/feedback', dependencies=auth)
	async def feedback(msg_id: str, body: FeedbackIn):
		return db.set_feedback(msg_id, body.value).model_dump()

	@app.post('/api/checkin-now', dependencies=auth)
	async def checkin_now():
		"""Ask the mentor to start a conversation now (bypasses timing gates, not the LLM's judgement on content)."""
		text = await mentor.write_ritual('ondemand', datetime.now(UTC))
		if not text:
			raise HTTPException(status_code=502, detail='mentor unavailable, try again')
		msg = db.add_message('mentor', text, kind='ondemand', reason='you asked')
		assert msg is not None
		return msg.model_dump()

	@app.post('/api/memory', dependencies=auth)
	async def add_memory(body: MemoryIn):
		return db.add_memory(body.kind, body.text, source='manual', due_at=body.due_at).model_dump()

	@app.patch('/api/memory/{item_id}', dependencies=auth)
	async def patch_memory(item_id: str, body: MemoryPatch):
		return db.update_memory(item_id, **body.model_dump(exclude_unset=True)).model_dump()

	@app.delete('/api/memory/{item_id}', dependencies=auth)
	async def delete_memory(item_id: str):
		db.delete_memory(item_id)
		return {'ok': True}

	@app.patch('/api/settings', dependencies=auth)
	async def patch_settings(request: Request):
		changes = await request.json()
		unknown = set(changes) - set(Settings.model_fields) if isinstance(changes, dict) else {'(not an object)'}
		if unknown:
			raise HTTPException(status_code=422, detail=f'unknown settings: {sorted(unknown)}')
		try:
			return db.update_settings(**changes).model_dump()
		except ValueError as e:
			raise HTTPException(status_code=422, detail=str(e)) from e

	@app.post('/api/focus', dependencies=auth)
	async def focus(body: FocusIn):
		until = (datetime.now(UTC) + timedelta(minutes=body.minutes)).isoformat(timespec='seconds') if body.minutes else ''
		return db.update_settings(focus_until=until).model_dump()

	@app.get('/healthz')
	async def healthz():
		last_tick = parse_iso(db.last_run('tick'))
		age = (datetime.now(UTC) - last_tick).total_seconds() if last_tick else None
		ok = not run_scheduler or (age is not None and age < config.tick_seconds * 3)
		return JSONResponse({'ok': ok, 'last_tick_age_s': age}, status_code=200 if ok else 503)

	@app.get('/')
	async def index():
		return FileResponse(STATIC_DIR / 'index.html', headers={'Cache-Control': 'no-cache'})

	@app.get('/sw.js')
	async def service_worker():
		return FileResponse(STATIC_DIR / 'sw.js', media_type='text/javascript', headers={'Cache-Control': 'no-cache'})

	app.mount('/static', StaticFiles(directory=STATIC_DIR), name='static')
	return app


def build() -> FastAPI:
	logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
	return create_app(load_config())
