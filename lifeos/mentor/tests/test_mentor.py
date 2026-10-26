"""Mentor tests. Real SQLite, real HTTP (pytest-httpserver stands in for ntfy); only the LLM is scripted."""

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.config import Config
from app.db import DB
from app.main import create_app
from app.mentor import Mentor
from app.notify import Notifier
from app.scheduler import Scheduler
from app.timing import base_gate, in_quiet_hours, local_now, spontaneous_gate
from app.views import CHECKIN_SCHEMA, MEMORY_UPDATE_SCHEMA, Settings
from fastapi.testclient import TestClient
from pytest_httpserver import HTTPServer


class ScriptedLLM:
	"""Stands in for Claude: returns canned replies per call type and records every request."""

	def __init__(self):
		self.calls: list[dict] = []
		self.reply = 'What would have to be true for that film to exist in a year?'
		self.decision = {
			'send': True,
			'lens': 'socrates',
			'reason': 'commitment due today',
			'message': 'Did you call the producer?',
		}
		self.memory_update: dict = {'add': [], 'complete_ids': []}

	async def complete(self, *, system, messages, effort='medium', schema=None, max_tokens=16000) -> str:
		self.calls.append({'system': system, 'messages': messages, 'effort': effort, 'schema': schema})
		assert messages[0]['role'] == 'user', 'API requires the first turn to be a user turn'
		assert all(a['role'] != b['role'] for a, b in zip(messages, messages[1:])), 'roles must alternate'
		if schema is CHECKIN_SCHEMA:
			return json.dumps(self.decision)
		if schema is MEMORY_UPDATE_SCHEMA:
			return json.dumps(self.memory_update)
		return self.reply


def make_config(tmp_path, **overrides: Any) -> Config:
	return Config(
		passphrase='correct horse battery', session_secret='x' * 32, db_path=str(tmp_path / 'm.db'), tick_seconds=60, **overrides
	)


def utc(s: str) -> datetime:
	return datetime.fromisoformat(s).replace(tzinfo=UTC)


@pytest.fixture
def llm():
	return ScriptedLLM()


@pytest.fixture
def db(tmp_path):
	return DB(str(tmp_path / 'm.db'))


# --- deterministic timing gate ----------------------------------------------------


def test_quiet_hours_wrap_midnight_in_local_time():
	s = Settings(timezone='America/La_Paz', quiet_start='21:30', quiet_end='08:00')  # UTC-4
	assert in_quiet_hours(local_now(utc('2026-10-27T02:00:00'), s), s)  # 22:00 local
	assert in_quiet_hours(local_now(utc('2026-10-27T11:30:00'), s), s)  # 07:30 local
	assert not in_quiet_hours(local_now(utc('2026-10-27T13:00:00'), s), s)  # 09:00 local


def test_gate_blocks_pause_focus_budget_spacing_and_live_chat():
	now = utc('2026-10-27T12:00:00')  # 13:00 Berlin
	s = Settings()
	assert base_gate(now, s.model_copy(update={'paused': True})).reason == 'paused'
	focused = s.model_copy(update={'focus_until': (now + timedelta(hours=1)).isoformat()})
	assert base_gate(now, focused).reason == 'focus mode'

	def gate(sent_today: int = 0, last_checkin_at=None, last_user_at=None, last_decision_at=None):
		return spontaneous_gate(now, s, sent_today, last_checkin_at, last_user_at, last_decision_at)

	assert gate().ok
	assert gate(sent_today=3).reason == 'daily budget used'
	assert gate(last_checkin_at=now - timedelta(hours=1)).reason == 'too soon after last check-in'
	assert gate(last_user_at=now - timedelta(minutes=10)).reason == 'conversation in progress'
	assert gate(last_decision_at=now - timedelta(minutes=30)).reason == 'decided recently'


# --- mentor + scheduler -----------------------------------------------------------


async def test_reply_stores_conversation_and_learns_memory(db, llm):
	mentor = Mentor(db, llm, 'Micha')
	db.add_message('mentor', 'An earlier check-in that came first.', kind='checkin')
	commitment = db.add_memory('commitment', 'Email the IDFA contact', source='manual', due_at='2026-10-27')
	llm.memory_update = {
		'add': [{'kind': 'value', 'text': 'Honest stories over pretty ones', 'due_date': ''}],
		'complete_ids': [commitment.id, 'not-a-real-id'],
	}
	user_msg, mentor_msg, added = await mentor.reply('I sent the IDFA email. I care about honest stories over pretty ones.')

	assert mentor_msg.content == llm.reply
	assert [m.text for m in added] == ['Honest stories over pretty ones']
	assert db.get_memory(commitment.id).status == 'done'
	assert [m.id for m in db.recent_messages()][-2:] == [user_msg.id, mentor_msg.id]
	chat_call = llm.calls[0]
	assert chat_call['system'][0]['cache_control'] == {'type': 'ephemeral'}  # stable prefix is cached
	assert 'Email the IDFA contact' in chat_call['system'][1]['text']  # memory is in context


async def test_tick_sends_evening_reflection_once_and_pushes(db, llm, httpserver: HTTPServer, tmp_path):
	httpserver.expect_request('/', method='POST').respond_with_json({'id': 'x'})
	config = make_config(
		tmp_path, ntfy_url=httpserver.url_for('').rstrip('/'), ntfy_topic='t', ntfy_token='tk_1', public_url='https://m.test'
	)
	db.add_memory('value', 'Craft over speed', source='manual')
	scheduler = Scheduler(db, Mentor(db, llm, 'Micha'), Notifier(config), tick_seconds=60)
	llm.reply = 'What did you notice about the light today?'

	evening = utc('2026-10-27T19:45:00')  # 20:45 Berlin
	assert await scheduler.tick(evening) == ['evening']
	assert await scheduler.tick(evening + timedelta(minutes=5)) == []  # idempotent per day

	(request, _), *_ = httpserver.log
	payload = json.loads(request.data)
	assert payload['topic'] == 't' and payload['title'] == 'Evening reflection'
	assert payload['click'].startswith('https://m.test/#m=')
	assert request.headers['Authorization'] == 'Bearer tk_1'
	assert db.last_run('tick') is not None  # heartbeat for /healthz


async def test_spontaneous_checkin_respects_llm_silence_and_budget(db, llm):
	db.add_memory('value', 'Craft over speed', source='manual')
	db.update_settings(max_checkins_per_day=1, evening_reflection='', weekly_review_time='')
	scheduler = Scheduler(db, Mentor(db, llm, 'Micha'), Notifier(make_config_no_push()), tick_seconds=60)
	morning = utc('2026-10-27T09:00:00')

	llm.decision = {'send': False, 'lens': 'socrates', 'reason': 'nothing worth interrupting for', 'message': ''}
	assert await scheduler.tick(morning) == []
	assert await scheduler.tick(morning + timedelta(minutes=10)) == []  # decided recently: no second LLM call
	assert sum(1 for c in llm.calls if c['schema'] is CHECKIN_SCHEMA) == 1

	llm.decision = {'send': True, 'lens': 'producer', 'reason': 'commitment due', 'message': 'Is the permit request out?'}
	assert await scheduler.tick(morning + timedelta(hours=2)) == ['checkin']
	assert await scheduler.tick(morning + timedelta(hours=6)) == []  # daily budget of 1 used
	last = db.last_message('mentor')
	assert last and last.lens == 'producer' and last.reason == 'commitment due'


async def test_onboarding_signal_when_values_unknown(db, llm):
	mentor = Mentor(db, llm, 'Micha')
	await mentor.decide_checkin(utc('2026-10-27T09:00:00'))
	assert 'onboarding' in llm.calls[-1]['messages'][-1]['content']


def make_config_no_push() -> Config:
	return Config(passphrase='correct horse battery', session_secret='x' * 32)


# --- HTTP API ---------------------------------------------------------------------


def test_api_auth_chat_memory_settings_and_timezone_follow(tmp_path, llm):
	app = create_app(make_config(tmp_path), llm=llm, run_scheduler=False)
	with TestClient(app) as client:
		assert client.get('/api/state').status_code == 401
		assert client.post('/api/login', json={'passphrase': 'nope nope'}).status_code == 401
		assert client.post('/api/login', json={'passphrase': 'correct horse battery'}).status_code == 200

		res = client.post(
			'/api/message', json={'text': 'Where should my first expedition film go?'}, headers={'X-Timezone': 'Asia/Kathmandu'}
		)
		assert res.status_code == 200 and res.json()['mentor']['content'] == llm.reply

		item = client.post('/api/memory', json={'kind': 'goal', 'text': 'Pitch at IDFA Forum 2027'}).json()
		assert client.patch(f'/api/memory/{item["id"]}', json={'status': 'done'}).json()['status'] == 'done'

		state = client.get('/api/state').json()
		assert state['settings']['timezone'] == 'Asia/Kathmandu'
		assert [m['role'] for m in state['messages']] == ['user', 'mentor']

		assert client.patch('/api/settings', json={'bogus': 1}).status_code == 422
		assert client.patch('/api/settings', json={'quiet_start': '25:00'}).status_code == 422
		assert client.patch('/api/settings', json={'max_checkins_per_day': 2}).json()['max_checkins_per_day'] == 2
		assert client.post('/api/focus', json={'minutes': 60}).json()['focus_until']

		assert client.get('/').status_code == 200 and client.get('/sw.js').status_code == 200
		assert client.get('/healthz').json()['ok']


def test_login_rate_limit(tmp_path, llm):
	app = create_app(make_config(tmp_path), llm=llm, run_scheduler=False)
	with TestClient(app) as client:
		codes = [client.post('/api/login', json={'passphrase': 'wrong wrong'}).status_code for _ in range(11)]
		assert codes[-1] == 429
		assert client.post('/api/login', json={'passphrase': 'correct horse battery'}).status_code == 429


def test_seed_loads_once(tmp_path, llm):
	seed = tmp_path / 'seed.json'
	seed.write_text(json.dumps([{'kind': 'north_star', 'text': 'Become an expedition filmmaker.'}]))
	config = make_config(tmp_path, seed_path=str(seed))
	create_app(config, llm=llm, run_scheduler=False)
	create_app(config, llm=llm, run_scheduler=False)
	assert [m.text for m in DB(config.db_path).list_memory()] == ['Become an expedition filmmaker.']
