"""SQLite store: settings, long-term memory, conversation, scheduler runs."""

import json
import secrets
import sqlite3
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.views import MEMORY_KINDS, Correction, Indicator, MemoryItem, Message, PersonModel, PersonModelBody, Settings

MIGRATIONS = (
	('messages', 'move', 'TEXT'),
	('messages', 'tz', 'TEXT'),
)  # columns added after the first release: (table, column, type)

SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS memory (
	id TEXT PRIMARY KEY,
	kind TEXT NOT NULL,
	text TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	due_at TEXT,
	source TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
	id TEXT PRIMARY KEY,
	role TEXT NOT NULL,
	content TEXT NOT NULL,
	kind TEXT NOT NULL DEFAULT 'chat',
	lens TEXT,
	reason TEXT,
	checkin_key TEXT UNIQUE,
	feedback INTEGER,
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_created ON messages(created_at);
CREATE TABLE IF NOT EXISTS runs (name TEXT PRIMARY KEY, at TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS indicators (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	unit TEXT NOT NULL,
	weekly_target REAL NOT NULL,
	active INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS indicator_logs (
	id TEXT PRIMARY KEY,
	indicator_id TEXT NOT NULL REFERENCES indicators(id),
	day TEXT NOT NULL,
	value REAL NOT NULL,
	source TEXT NOT NULL,
	note TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS indicator_logs_day ON indicator_logs(indicator_id, day);
CREATE TABLE IF NOT EXISTS daily_state (day TEXT PRIMARY KEY, energy INTEGER, note TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS person_models (
	id TEXT PRIMARY KEY,
	version INTEGER NOT NULL,
	built_at TEXT NOT NULL,
	built_with TEXT NOT NULL,
	data_days INTEGER NOT NULL,
	data_messages INTEGER NOT NULL,
	body TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS corrections (id TEXT PRIMARY KEY, claim TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS push_subs (
	endpoint TEXT PRIMARY KEY,
	p256dh TEXT NOT NULL,
	auth TEXT NOT NULL,
	user_agent TEXT,
	created_at TEXT NOT NULL
);
"""


def now_iso(at: datetime | None = None) -> str:
	return (at or datetime.now(UTC)).astimezone(UTC).isoformat(timespec='seconds')


def new_id() -> str:
	return uuid.uuid4().hex


class DB:
	def __init__(self, path: str):
		if path != ':memory:':
			Path(path).parent.mkdir(parents=True, exist_ok=True)
		self._conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
		self._conn.row_factory = sqlite3.Row
		self._lock = threading.Lock()
		with self._lock:
			self._conn.execute('PRAGMA journal_mode=WAL')
			self._conn.executescript(SCHEMA)
			for table, column, kind in MIGRATIONS:
				if column not in {r['name'] for r in self._conn.execute(f'PRAGMA table_info({table})')}:
					self._conn.execute(f'ALTER TABLE {table} ADD COLUMN {column} {kind}')

	def _exec(self, sql: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
		with self._lock:
			return self._conn.execute(sql, params).fetchall()

	# --- settings -------------------------------------------------------

	def get_settings(self) -> Settings:
		rows = self._exec('SELECT key, value FROM settings')
		stored = {r['key']: json.loads(r['value']) for r in rows}
		return Settings.model_validate({**Settings().model_dump(), **stored})

	def update_settings(self, **changes: Any) -> Settings:
		merged = Settings.model_validate({**self.get_settings().model_dump(), **changes})
		for key in changes:
			self._exec(
				'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
				(key, json.dumps(getattr(merged, key))),
			)
		return merged

	def session_epoch(self) -> int:
		rows = self._exec("SELECT value FROM settings WHERE key='_session_epoch'")
		return int(json.loads(rows[0]['value'])) if rows else 0

	def bump_session_epoch(self) -> int:
		"""Invalidate every issued session cookie (logout = log out everywhere)."""
		epoch = self.session_epoch() + 1
		self._exec(
			"INSERT INTO settings(key, value) VALUES('_session_epoch', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
			(json.dumps(epoch),),
		)
		return epoch

	def voice_token(self) -> str:
		"""Bearer token for the Siri shortcut; created on first use."""
		rows = self._exec("SELECT value FROM settings WHERE key='_voice_token'")
		return json.loads(rows[0]['value']) if rows else self.rotate_voice_token()

	def rotate_voice_token(self) -> str:
		token = secrets.token_urlsafe(32)
		self._exec(
			"INSERT INTO settings(key, value) VALUES('_voice_token', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
			(json.dumps(token),),
		)
		return token

	def all_messages(self) -> list[Message]:
		return [Message.model_validate(dict(r)) for r in self._exec('SELECT * FROM messages ORDER BY created_at, rowid')]

	def message_count(self) -> int:
		return self._exec('SELECT count(*) AS n FROM messages')[0]['n']

	# --- person model (derived, versioned) -----------------------------------

	def save_person_model(
		self, body: PersonModelBody, built_with: str, data_days: int, data_messages: int, at: datetime | None = None
	) -> PersonModel:
		version = self._exec('SELECT coalesce(max(version), 0) + 1 AS v FROM person_models')[0]['v']
		model_id = new_id()
		self._exec(
			'INSERT INTO person_models(id, version, built_at, built_with, data_days, data_messages, body) VALUES(?,?,?,?,?,?,?)',
			(model_id, version, now_iso(at), built_with, data_days, data_messages, body.model_dump_json()),
		)
		return self.person_model(version)  # type: ignore[return-value]

	def person_model(self, version: int | None = None) -> PersonModel | None:
		sql = 'SELECT * FROM person_models ' + ('WHERE version=?' if version else 'ORDER BY version DESC LIMIT 1')
		rows = self._exec(sql, (version,) if version else ())
		if not rows:
			return None
		r = dict(rows[0])
		body = json.loads(r.pop('body'))
		return PersonModel.model_validate({**body, **r})

	def person_model_history(self) -> list[dict[str, Any]]:
		"""Version, date and average confidence per build: how the picture sharpened over time."""
		out = []
		for r in self._exec(
			'SELECT version, built_at, built_with, data_days, data_messages, body FROM person_models ORDER BY version'
		):
			body = json.loads(r['body'])
			confs = [t['confidence'] for t in body.get('traits', [])] + [p['confidence'] for p in body.get('patterns', [])]
			out.append(
				{
					'version': r['version'],
					'built_at': r['built_at'],
					'built_with': r['built_with'],
					'data_days': r['data_days'],
					'data_messages': r['data_messages'],
					'confidence': round(sum(confs) / len(confs), 2) if confs else 0.0,
				}
			)
		return out

	def add_correction(self, claim: str, note: str, at: datetime | None = None) -> Correction:
		claim, note = claim.strip(), note.strip()
		assert claim, 'claim must not be empty'
		cid = new_id()
		self._exec(
			'INSERT INTO corrections(id, claim, note, created_at) VALUES(?,?,?,?)', (cid, claim[:500], note[:1000], now_iso(at))
		)
		return Correction.model_validate(dict(self._exec('SELECT * FROM corrections WHERE id=?', (cid,))[0]))

	def list_corrections(self) -> list[Correction]:
		return [Correction.model_validate(dict(r)) for r in self._exec('SELECT * FROM corrections ORDER BY created_at')]

	# --- web push subscriptions ------------------------------------------

	def add_push_sub(self, endpoint: str, p256dh: str, auth: str, user_agent: str = '') -> None:
		assert endpoint.startswith(('https://', 'http://')), 'push endpoint must be a URL'  # the API only accepts https
		self._exec(
			'INSERT INTO push_subs(endpoint, p256dh, auth, user_agent, created_at) VALUES(?,?,?,?,?) '
			'ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, user_agent=excluded.user_agent',
			(endpoint, p256dh, auth, user_agent[:300], now_iso()),
		)

	def list_push_subs(self) -> list[dict[str, str]]:
		return [dict(r) for r in self._exec('SELECT endpoint, p256dh, auth, user_agent FROM push_subs ORDER BY created_at')]

	def delete_push_sub(self, endpoint: str) -> None:
		self._exec('DELETE FROM push_subs WHERE endpoint=?', (endpoint,))

	# --- memory ---------------------------------------------------------

	def add_memory(self, kind: str, text: str, source: str, due_at: str | None = None) -> MemoryItem:
		assert kind in MEMORY_KINDS, f'unknown memory kind {kind!r}'
		text = text.strip()
		assert text, 'memory text must not be empty'
		existing = self._exec('SELECT id FROM memory WHERE kind=? AND lower(text)=lower(?) AND status=?', (kind, text, 'active'))
		if existing:
			return self.get_memory(existing[0]['id'])
		item_id, ts = new_id(), now_iso()
		self._exec(
			'INSERT INTO memory(id, kind, text, status, due_at, source, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?)',
			(item_id, kind, text, 'active', due_at, source, ts, ts),
		)
		return self.get_memory(item_id)

	def get_memory(self, item_id: str) -> MemoryItem:
		rows = self._exec('SELECT * FROM memory WHERE id=?', (item_id,))
		assert rows, f'memory {item_id} not found'
		return MemoryItem.model_validate(dict(rows[0]))

	def list_memory(self, include_done: bool = False) -> list[MemoryItem]:
		sql = 'SELECT * FROM memory' + ('' if include_done else " WHERE status='active'") + ' ORDER BY kind, created_at'
		return [MemoryItem.model_validate(dict(r)) for r in self._exec(sql)]

	def update_memory(self, item_id: str, **changes: Any) -> MemoryItem:
		allowed = {'text', 'status', 'due_at', 'kind'}
		assert set(changes) <= allowed, f'cannot update {set(changes) - allowed}'
		if 'kind' in changes:
			assert changes['kind'] in MEMORY_KINDS
		for key, value in changes.items():
			self._exec(f'UPDATE memory SET {key}=?, updated_at=? WHERE id=?', (value, now_iso(), item_id))
		return self.get_memory(item_id)

	def delete_memory(self, item_id: str) -> None:
		self._exec('DELETE FROM memory WHERE id=?', (item_id,))

	def memory_count(self) -> int:
		return self._exec('SELECT count(*) AS n FROM memory')[0]['n']

	# --- messages -------------------------------------------------------

	def add_message(
		self,
		role: str,
		content: str,
		kind: str = 'chat',
		lens: str | None = None,
		reason: str | None = None,
		checkin_key: str | None = None,
		at: datetime | None = None,
		move: str | None = None,
	) -> Message | None:
		"""Insert a message. Returns None if checkin_key was already used (idempotent check-ins)."""
		assert role in ('user', 'mentor')
		msg_id = new_id()
		try:
			self._exec(
				'INSERT INTO messages(id, role, content, kind, lens, move, reason, checkin_key, tz, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
				(msg_id, role, content, kind, lens, move, reason, checkin_key, self.get_settings().timezone, now_iso(at)),
			)
		except sqlite3.IntegrityError:
			return None
		return self.get_message(msg_id)

	def get_message(self, msg_id: str) -> Message:
		rows = self._exec('SELECT * FROM messages WHERE id=?', (msg_id,))
		assert rows, f'message {msg_id} not found'
		return Message.model_validate(dict(rows[0]))

	def recent_messages(self, limit: int = 40) -> list[Message]:
		rows = self._exec('SELECT * FROM messages ORDER BY created_at DESC, rowid DESC LIMIT ?', (limit,))
		return [Message.model_validate(dict(r)) for r in reversed(rows)]

	def set_feedback(self, msg_id: str, value: int) -> Message:
		assert value in (-1, 0, 1)
		self._exec('UPDATE messages SET feedback=? WHERE id=?', (value, msg_id))
		return self.get_message(msg_id)

	def checkins_since(self, since_iso: str) -> list[Message]:
		rows = self._exec(
			"SELECT * FROM messages WHERE role='mentor' AND kind!='chat' AND created_at>=? ORDER BY created_at",
			(since_iso,),
		)
		return [Message.model_validate(dict(r)) for r in rows]

	def last_message(self, role: str, kinds: tuple[str, ...] | None = None) -> Message | None:
		sql, params = 'SELECT * FROM messages WHERE role=?', [role]
		if kinds:
			sql += f' AND kind IN ({",".join("?" * len(kinds))})'
			params.extend(kinds)
		rows = self._exec(sql + ' ORDER BY created_at DESC, rowid DESC LIMIT 1', tuple(params))
		return Message.model_validate(dict(rows[0])) if rows else None

	def messages_between(self, start_iso: str, end_iso: str) -> list[Message]:
		rows = self._exec(
			'SELECT * FROM messages WHERE created_at>=? AND created_at<? ORDER BY created_at, rowid', (start_iso, end_iso)
		)
		return [Message.model_validate(dict(r)) for r in rows]

	# --- leading indicators ---------------------------------------------

	def add_indicator(self, name: str, unit: str, weekly_target: float) -> Indicator:
		assert name.strip() and unit.strip(), 'indicator needs a name and a unit'
		assert weekly_target >= 0
		item_id = new_id()
		self._exec(
			'INSERT INTO indicators(id, name, unit, weekly_target, active, created_at) VALUES(?,?,?,?,1,?)',
			(item_id, name.strip(), unit.strip(), weekly_target, now_iso()),
		)
		return self.get_indicator(item_id)

	def get_indicator(self, item_id: str) -> Indicator:
		rows = self._exec('SELECT * FROM indicators WHERE id=?', (item_id,))
		assert rows, f'indicator {item_id} not found'
		return Indicator.model_validate({**dict(rows[0]), 'active': bool(rows[0]['active'])})

	def list_indicators(self, include_inactive: bool = False) -> list[Indicator]:
		sql = 'SELECT id FROM indicators' + ('' if include_inactive else ' WHERE active=1') + ' ORDER BY created_at, rowid'
		return [self.get_indicator(r['id']) for r in self._exec(sql)]

	def update_indicator(self, item_id: str, **changes: Any) -> Indicator:
		allowed = {'name', 'unit', 'weekly_target', 'active'}
		assert set(changes) <= allowed, f'cannot update {set(changes) - allowed}'
		for key, value in changes.items():
			self._exec(f'UPDATE indicators SET {key}=? WHERE id=?', (int(value) if key == 'active' else value, item_id))
		return self.get_indicator(item_id)

	def log_indicator(self, indicator_id: str, day: str, value: float, source: str, note: str = '') -> None:
		self.get_indicator(indicator_id)  # asserts it exists
		self._exec(
			'INSERT INTO indicator_logs(id, indicator_id, day, value, source, note, created_at) VALUES(?,?,?,?,?,?,?)',
			(new_id(), indicator_id, day, value, source, note, now_iso()),
		)

	def indicator_total(self, indicator_id: str, start_day: str, end_day: str) -> float:
		"""Sum of logged values for local days in [start_day, end_day]."""
		rows = self._exec(
			'SELECT coalesce(sum(value), 0) AS total FROM indicator_logs WHERE indicator_id=? AND day>=? AND day<=?',
			(indicator_id, start_day, end_day),
		)
		return float(rows[0]['total'])

	# --- daily state ----------------------------------------------------

	def set_energy(self, day: str, energy: int, note: str = '') -> None:
		assert 1 <= energy <= 5, 'energy is 1..5'
		self._exec(
			'INSERT INTO daily_state(day, energy, note, updated_at) VALUES(?,?,?,?) '
			'ON CONFLICT(day) DO UPDATE SET energy=excluded.energy, note=excluded.note, updated_at=excluded.updated_at',
			(day, energy, note, now_iso()),
		)

	def energies(self, start_day: str, end_day: str) -> dict[str, int]:
		rows = self._exec(
			'SELECT day, energy FROM daily_state WHERE day>=? AND day<=? AND energy IS NOT NULL', (start_day, end_day)
		)
		return {r['day']: r['energy'] for r in rows}

	# --- scheduler runs -------------------------------------------------

	def mark_run(self, name: str, detail: str = '', at: datetime | None = None) -> None:
		self._exec(
			'INSERT INTO runs(name, at, detail) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET at=excluded.at, detail=excluded.detail',
			(name, now_iso(at), detail),
		)

	def last_run(self, name: str) -> str | None:
		rows = self._exec('SELECT at FROM runs WHERE name=?', (name,))
		return rows[0]['at'] if rows else None
