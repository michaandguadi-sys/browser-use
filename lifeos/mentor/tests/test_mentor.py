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
from app.scorecard import build_scorecard, format_scorecard
from app.timing import base_gate, in_quiet_hours, local_now, spontaneous_gate
from app.views import CHECKIN_SCHEMA, INTERVIEW_TOPICS, MEMORY_UPDATE_SCHEMA, Settings
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
		self.memory_update: dict = {'add': [], 'complete_ids': [], 'log': []}

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


async def test_reply_stores_conversation_learns_memory_and_logs_progress(db, llm):
	mentor = Mentor(db, llm, 'Micha')
	hours = db.add_indicator('Hours on own film', 'h', 5)
	db.add_message('mentor', 'An earlier check-in that came first.', kind='checkin')
	commitment = db.add_memory('commitment', 'Email the IDFA contact', source='manual', due_at='2026-10-27')
	llm.memory_update = {
		'add': [{'kind': 'value', 'text': 'Honest stories over pretty ones', 'due_date': ''}],
		'complete_ids': [commitment.id, 'not-a-real-id'],
		'log': [{'indicator_id': hours.id, 'value': 2}, {'indicator_id': 'bogus', 'value': 3}],
	}
	now = utc('2026-10-28T15:00:00')  # Wednesday
	user_msg, mentor_msg, added, logged = await mentor.reply('Sent the IDFA email and cut 2 hours on the film.', now)

	assert mentor_msg.content == llm.reply
	assert [m.text for m in added] == ['Honest stories over pretty ones']
	assert logged == [{'indicator_id': hours.id, 'name': 'Hours on own film', 'unit': 'h', 'value': 2}]
	assert build_scorecard(db, now).indicators[0].actual == 2
	assert db.get_memory(commitment.id).status == 'done'
	assert [m.id for m in db.recent_messages()][-2:] == [user_msg.id, mentor_msg.id]
	chat_call = llm.calls[0]
	assert chat_call['system'][0]['cache_control'] == {'type': 'ephemeral'}  # stable prefix is cached
	assert 'Email the IDFA contact' in chat_call['system'][1]['text']  # memory is in context
	assert 'Hours on own film: 0 / 5 h' in chat_call['system'][1]['text']  # evidence is in context


def test_scorecard_counts_local_week_commitments_energy_and_ratings(db):
	db.update_settings(timezone='America/La_Paz')  # UTC-4
	now = utc('2026-10-29T12:00:00')  # Thursday 08:00 local -> week Mon 26 .. Sun Nov 1, day 4
	film = db.add_indicator('Film hours', 'h', 7)
	db.log_indicator(film.id, '2026-10-25', 9, source='manual')  # previous Sunday: last week
	db.log_indicator(film.id, '2026-10-26', 1.5, source='manual')
	db.log_indicator(film.id, '2026-10-28', 0.5, source='manual')
	done = db.add_memory('commitment', 'Send teaser to Hot Docs', source='manual', due_at='2026-10-27')
	db.update_memory(done.id, status='done')
	db.add_memory('commitment', 'Book interview', source='manual', due_at='2026-10-28')  # still open -> overdue
	db.add_memory('commitment', 'Next week thing', source='manual', due_at='2026-11-04')
	db.set_energy('2026-10-27', 4)
	db.set_energy('2026-10-28', 2)
	useful = db.add_message('mentor', 'q', kind='checkin', at=utc('2026-10-27T15:00:00'))
	assert useful
	db.set_feedback(useful.id, 1)

	card = build_scorecard(db, now)
	assert (card.week_start, card.week_end, card.days_elapsed) == ('2026-10-26', '2026-11-01', 4)
	assert card.indicators[0].actual == 2
	assert (card.commitments_due, card.commitments_done, card.kept_rate) == (2, 1, 0.5)
	assert card.commitments_overdue == ['Book interview']
	assert (card.energy_avg, card.energy_days) == (3.0, 2)
	assert (card.checkins_rated, card.checkins_useful) == (1, 1)
	assert 'behind pace' in format_scorecard(card)  # 2 of expected 4 by day 4
	assert build_scorecard(db, now, weeks_ago=1).indicators[0].actual == 9


async def test_interview_steers_until_all_topics_known_then_stops(db, llm):
	mentor = Mentor(db, llm, 'Micha')
	msg = await mentor.start_interview(utc('2026-10-28T15:00:00'))
	assert msg and msg.kind == 'interview' and db.get_settings().interview_active
	assert '- north_star:' in llm.calls[-1]['messages'][-1]['content']

	_, reply, _, _ = await mentor.reply('I want to make films about water and the people fighting for it.')
	assert reply.kind == 'interview'
	assert '[system: interview]' in llm.calls[-2]['messages'][-1]['content']  # steer was appended to the reply call

	llm.memory_update = {
		'add': [{'kind': k, 'text': f'known {k}', 'due_date': ''} for k in INTERVIEW_TOPICS],
		'complete_ids': [],
		'log': [],
	}
	await mentor.reply('That covers everything, I think.')
	assert mentor.missing_topics() == []
	assert not db.get_settings().interview_active


async def test_checkin_signal_flags_behind_pace_and_low_energy(db, llm):
	db.add_memory('value', 'Craft over speed', source='manual')
	db.add_indicator('Doc contacts', 'contacts', 2)
	db.set_energy('2026-10-29', 2)
	await Mentor(db, llm, 'Micha').decide_checkin(utc('2026-10-29T12:00:00'))  # Thursday in Berlin
	signal = llm.calls[-1]['messages'][-1]['content']
	assert 'Behind on "Doc contacts": 0 of 2 contacts' in signal
	assert 'Energy logged low today' in signal


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

		progress = client.get('/api/state').json()
		assert [i['name'] for i in progress['indicators']][0].startswith('Hours on own documentary')  # defaults seeded
		first = progress['indicators'][0]['id']
		after_log = client.post(f'/api/indicators/{first}/log', json={'value': 1.5}).json()
		assert after_log['scorecard']['indicators'][0]['actual'] == 1.5
		assert client.post(f'/api/indicators/{first}/log', json={'value': 0}).status_code == 422
		assert client.post('/api/indicators/nope/log', json={'value': 1}).status_code == 400
		assert client.post('/api/today', json={'energy': 4}).json()['today']['energy'] == 4
		added = client.post('/api/indicators', json={'name': 'No-AI edit reps', 'unit': 'reps', 'weekly_target': 2}).json()
		assert len(added['indicators']) == 3
		new_id = added['indicators'][-1]['id']
		assert len(client.patch(f'/api/indicators/{new_id}', json={'active': False}).json()['indicators']) == 2
		assert client.post('/api/interview').json()['kind'] == 'interview'
		assert client.post('/api/interview/pause').json()['interview']['active'] is False

		assert client.get('/').status_code == 200 and client.get('/sw.js').status_code == 200
		assert client.get('/healthz').json()['ok']

		stolen_cookie = client.cookies.get('mentor_session')
		assert stolen_cookie
		assert client.post('/api/logout').status_code == 200
		client.cookies.set('mentor_session', stolen_cookie)
		assert client.get('/api/state').status_code == 401  # logout revokes server-side, not just in the browser


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


# --- web push + Siri ----------------------------------------------------------


def _browser_subscription(endpoint: str) -> tuple[dict, Any, bytes]:
	"""What a phone's PushManager hands the app: an ECDH key pair and an auth secret."""
	import os

	from app.webpush import b64url
	from cryptography.hazmat.primitives import serialization
	from cryptography.hazmat.primitives.asymmetric import ec

	key = ec.generate_private_key(ec.SECP256R1())
	auth = os.urandom(16)
	pub = key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
	return {'endpoint': endpoint, 'keys': {'p256dh': b64url(pub), 'auth': b64url(auth)}}, key, auth


def _b64decode(s: str) -> bytes:
	import base64

	return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))


async def test_checkin_push_reaches_the_app_encrypted_and_signed(db, llm, httpserver: HTTPServer, tmp_path):
	import http_ece
	from app.webpush import WebPush
	from cryptography.hazmat.primitives import hashes
	from cryptography.hazmat.primitives.asymmetric import ec
	from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature

	httpserver.expect_request('/push/phone', method='POST').respond_with_data('', status=201)
	httpserver.expect_request('/push/gone', method='POST').respond_with_data('', status=410)
	sub, browser_key, auth = _browser_subscription(httpserver.url_for('/push/phone'))
	gone, _, _ = _browser_subscription(httpserver.url_for('/push/gone'))
	for s in (sub, gone):
		db.add_push_sub(s['endpoint'], s['keys']['p256dh'], s['keys']['auth'])
	webpush = WebPush(db, tmp_path / 'vapid.pem', subject='https://m.test')
	scheduler = Scheduler(db, Mentor(db, llm, 'Micha'), Notifier(make_config(tmp_path), webpush), tick_seconds=60)
	llm.reply = 'What did you notice about the light today?'

	assert await scheduler.tick(utc('2026-10-27T19:45:00')) == ['evening']

	request = next(r for r, _ in httpserver.log if r.path == '/push/phone')
	assert request.headers['Content-Encoding'] == 'aes128gcm'
	assert request.headers['TTL'] == '14400'
	payload = json.loads(http_ece.decrypt(request.data, private_key=browser_key, auth_secret=auth, version='aes128gcm'))
	msg = db.last_message('mentor', kinds=('evening',))
	assert payload == {
		'title': 'Evening reflection',
		'body': 'What did you notice about the light today?',
		'url': f'/#m={msg.id}',
		'tag': msg.id,
	}

	# VAPID: a JWT for this push service, signed with the key the app subscribed with
	scheme, params = request.headers['Authorization'].split(' ', 1)
	assert scheme == 'vapid'
	fields = dict(p.strip().split('=', 1) for p in params.split(','))
	assert fields['k'] == webpush.public_key
	header_b64, claims_b64, sig_b64 = fields['t'].split('.')
	claims = json.loads(_b64decode(claims_b64))
	assert claims['aud'] == httpserver.url_for('/').rstrip('/') and claims['sub'] == 'https://m.test'
	sig = _b64decode(sig_b64)
	public = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), _b64decode(webpush.public_key))
	public.verify(
		encode_dss_signature(int.from_bytes(sig[:32], 'big'), int.from_bytes(sig[32:], 'big')),
		f'{header_b64}.{claims_b64}'.encode(),
		ec.ECDSA(hashes.SHA256()),
	)

	assert [s['endpoint'] for s in db.list_push_subs()] == [sub['endpoint']]  # 410 Gone was forgotten
	assert WebPush(db, tmp_path / 'vapid.pem', subject='https://m.test').public_key == webpush.public_key  # key survives restarts


def test_push_subscribe_api_and_siri_voice(tmp_path, llm):
	import time as _time

	app = create_app(make_config(tmp_path, public_url='https://m.test'), llm=llm, run_scheduler=False)
	sub, _, _ = _browser_subscription('https://web.push.apple.com/abc')
	with TestClient(app) as client:
		assert client.get('/api/push/key').status_code == 401
		assert client.post('/api/voice', json={'text': 'hi'}).status_code == 401
		client.post('/api/login', json={'passphrase': 'correct horse battery'})

		key = client.get('/api/push/key').json()['publicKey']
		assert len(_b64decode(key)) == 65  # uncompressed P-256 point, what PushManager.subscribe wants
		assert client.post('/api/push/subscribe', json={**sub, 'endpoint': 'http://insecure.test/x'}).status_code == 422
		assert client.post('/api/push/subscribe', json=sub).json() == {'devices': 1}
		assert client.post('/api/push/subscribe', json=sub).json() == {'devices': 1}  # re-subscribing is idempotent
		assert client.get('/api/state').json()['push']['devices'] == 1

		setup = client.get('/api/voice/setup').json()
		assert setup['url'] == 'https://m.test/api/voice' and len(setup['token']) >= 40
		voice = TestClient(app)  # the Shortcut has no session cookie, only the token
		assert voice.post('/api/voice', json={'text': 'hi'}, headers={'Authorization': 'Bearer wrong'}).status_code == 401
		llm.reply = 'Good. What is the first shot you need tomorrow?'
		res = voice.post(
			'/api/voice',
			json={'text': 'Just spent 2 hours on the Andes edit'},
			headers={'Authorization': f'Bearer {setup["token"]}'},
		)
		assert res.status_code == 200 and res.headers['content-type'].startswith('text/plain')
		assert res.text == 'Good. What is the first shot you need tomorrow?'
		spoken = llm.calls[-1] if llm.calls[-1]['schema'] is None else llm.calls[-2]
		assert spoken['effort'] == 'low' and '[system: voice]' in spoken['messages'][-1]['content']
		texts = [m['content'] for m in client.get('/api/state').json()['messages']]
		assert texts[-2:] == ['Just spent 2 hours on the Andes edit', 'Good. What is the first shot you need tomorrow?']
		deadline = _time.monotonic() + 5
		while not any(c['schema'] is MEMORY_UPDATE_SCHEMA for c in llm.calls) and _time.monotonic() < deadline:
			_time.sleep(0.05)
		assert any(c['schema'] is MEMORY_UPDATE_SCHEMA for c in llm.calls), 'memory update runs after the spoken reply'

		new = client.post('/api/voice/rotate').json()['token']
		assert new != setup['token']
		assert (
			voice.post('/api/voice', json={'text': 'hi'}, headers={'Authorization': f'Bearer {setup["token"]}'}).status_code
			== 401
		)
