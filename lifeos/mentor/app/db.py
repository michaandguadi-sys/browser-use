"""SQLite store: settings, long-term memory, conversation, scheduler runs."""

import json
import sqlite3
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.views import MEMORY_KINDS, MemoryItem, Message, Settings

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
	) -> Message | None:
		"""Insert a message. Returns None if checkin_key was already used (idempotent check-ins)."""
		assert role in ('user', 'mentor')
		msg_id = new_id()
		try:
			self._exec(
				'INSERT INTO messages(id, role, content, kind, lens, reason, checkin_key, created_at) VALUES(?,?,?,?,?,?,?,?)',
				(msg_id, role, content, kind, lens, reason, checkin_key, now_iso(at)),
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

	# --- scheduler runs -------------------------------------------------

	def mark_run(self, name: str, detail: str = '', at: datetime | None = None) -> None:
		self._exec(
			'INSERT INTO runs(name, at, detail) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET at=excluded.at, detail=excluded.detail',
			(name, now_iso(at), detail),
		)

	def last_run(self, name: str) -> str | None:
		rows = self._exec('SELECT at FROM runs WHERE name=?', (name,))
		return rows[0]['at'] if rows else None
