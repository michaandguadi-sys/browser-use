"""The mentor: chat replies, memory updates, proactive check-ins and rituals."""

import json
import logging
from datetime import UTC, datetime, timedelta

from app.db import DB
from app.llm import LLM, LLMError
from app.prompts import (
	CHECKIN_INSTRUCTION,
	CONTEXT_TEMPLATE,
	EVENING_INSTRUCTION,
	EXTRACT_INSTRUCTION,
	ONDEMAND_INSTRUCTION,
	SYSTEM_PROMPT,
	WEEKLY_INSTRUCTION,
)
from app.timing import local_day_start_utc, local_now, parse_iso
from app.views import CHECKIN_SCHEMA, MEMORY_UPDATE_SCHEMA, CheckinDecision, MemoryItem, MemoryUpdate, Message

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 30


class Mentor:
	def __init__(self, db: DB, llm: LLM, owner: str):
		self.db = db
		self.llm = llm
		self.owner = owner
		self._system_prompt = SYSTEM_PROMPT.format(owner=owner)

	# --- context ----------------------------------------------------------

	def _system(self, now_utc: datetime) -> list[dict]:
		settings = self.db.get_settings()
		local = local_now(now_utc, settings)
		memory = [m for m in self.db.list_memory() if m.kind != 'commitment']
		commitments = [m for m in self.db.list_memory() if m.kind == 'commitment']
		context = CONTEXT_TEMPLATE.format(
			owner=self.owner,
			local_time=local.strftime('%A %Y-%m-%d %H:%M'),
			timezone=settings.timezone,
			memory='\n'.join(f'- [{m.kind}] {m.text}' for m in memory) or '- (nothing yet)',
			commitments='\n'.join(f'- {m.text}' + (f' (due {m.due_at})' if m.due_at else '') for m in commitments) or '- (none)',
		)
		return [
			{'type': 'text', 'text': self._system_prompt, 'cache_control': {'type': 'ephemeral'}},
			{'type': 'text', 'text': context},
		]

	@staticmethod
	def _history(messages: list[Message]) -> list[dict]:
		"""Conversation as API turns. Check-ins are mentor turns; the API needs a user turn first."""
		turns: list[dict] = []
		for m in messages:
			role = 'user' if m.role == 'user' else 'assistant'
			if turns and turns[-1]['role'] == role:
				turns[-1]['content'] += '\n\n' + m.content
			else:
				turns.append({'role': role, 'content': m.content})
		if turns and turns[0]['role'] == 'assistant':
			turns.insert(0, {'role': 'user', 'content': '(earlier conversation)'})
		return turns

	# --- chat -------------------------------------------------------------

	async def reply(self, text: str, now_utc: datetime | None = None) -> tuple[Message, Message, list[MemoryItem]]:
		"""Store the user's message, answer it, then update long-term memory from the exchange."""
		now_utc = now_utc or datetime.now(UTC)
		text = text.strip()
		assert text, 'message must not be empty'
		user_msg = self.db.add_message('user', text, at=now_utc)
		assert user_msg is not None
		turns = self._history(self.db.recent_messages(HISTORY_LIMIT))
		try:
			answer = await self.llm.complete(system=self._system(now_utc), messages=turns, effort='medium')
		except LLMError as e:
			logger.warning('reply failed: %s', e)
			answer = f'(I could not reach my brain just now: {e}. Your message is saved; try again in a minute.)'
		mentor_msg = self.db.add_message('mentor', answer, at=now_utc)
		assert mentor_msg is not None
		added = await self.update_memory(user_msg, mentor_msg)
		return user_msg, mentor_msg, added

	async def update_memory(self, user_msg: Message, mentor_msg: Message) -> list[MemoryItem]:
		existing = self.db.list_memory()
		prompt = EXTRACT_INSTRUCTION.format(
			owner=self.owner,
			memory_with_ids='\n'.join(f'{m.id}: {m.kind}: {m.text}' for m in existing) or '(empty)',
			exchange=f'{self.owner}: {user_msg.content}\nMentor: {mentor_msg.content}',
		)
		try:
			raw = await self.llm.complete(
				system=[{'type': 'text', 'text': 'You maintain a precise, minimal long-term memory for a mentor.'}],
				messages=[{'role': 'user', 'content': prompt}],
				effort='low',
				schema=MEMORY_UPDATE_SCHEMA,
				max_tokens=4000,
			)
			update = MemoryUpdate.model_validate(json.loads(raw))
		except (LLMError, ValueError) as e:
			logger.warning('memory update skipped: %s', e)
			return []
		valid_ids = {m.id for m in existing if m.kind == 'commitment'}
		for item_id in update.complete_ids:
			if item_id in valid_ids:
				self.db.update_memory(item_id, status='done')
		added = []
		for new in update.add:
			if new.text.strip():
				added.append(self.db.add_memory(new.kind, new.text, source='conversation', due_at=new.due_date or None))
		return added

	# --- proactive ----------------------------------------------------------

	def _signal(self, now_utc: datetime) -> str:
		memory = self.db.list_memory()
		if not any(m.kind == 'value' for m in memory):
			return 'Their values are not in memory yet: onboarding. Ask one deep, open question about what matters most to them.'
		today = local_now(now_utc, self.db.get_settings()).date().isoformat()
		due = [m for m in memory if m.kind == 'commitment' and m.due_at and m.due_at <= today]
		if due:
			return 'Commitment due or overdue: ' + '; '.join(f'"{m.text}" (due {m.due_at})' for m in due)
		return 'none'

	async def decide_checkin(self, now_utc: datetime) -> CheckinDecision | None:
		settings = self.db.get_settings()
		local = local_now(now_utc, settings)
		recent_checkins = self.db.checkins_since((now_utc - timedelta(days=14)).isoformat(timespec='seconds'))
		last_user = self.db.last_message('user')
		last_checkin = recent_checkins[-1] if recent_checkins else None
		instruction = CHECKIN_INSTRUCTION.format(
			owner=self.owner,
			local_time=local.strftime('%H:%M'),
			timezone=settings.timezone,
			weekday=local.strftime('%A'),
			sent_today=self.sent_today(now_utc),
			budget=settings.max_checkins_per_day,
			hours_since_user=_hours_since(now_utc, last_user.created_at if last_user else None),
			hours_since_checkin=_hours_since(now_utc, last_checkin.created_at if last_checkin else None),
			feedback=', '.join(str(m.feedback) for m in recent_checkins if m.feedback) or 'none yet',
			signal=self._signal(now_utc),
		)
		turns = _with_instruction(
			self._history(self.db.recent_messages(HISTORY_LIMIT)), 'proactive check-in decision', instruction
		)
		try:
			raw = await self.llm.complete(system=self._system(now_utc), messages=turns, effort='low', schema=CHECKIN_SCHEMA)
			decision = CheckinDecision.model_validate(json.loads(raw))
		except (LLMError, ValueError) as e:
			logger.warning('check-in decision failed: %s', e)
			return None
		if decision.send and not decision.message.strip():
			return None
		return decision

	async def write_ritual(self, kind: str, now_utc: datetime) -> str | None:
		templates = {'evening': EVENING_INSTRUCTION, 'weekly': WEEKLY_INSTRUCTION, 'ondemand': ONDEMAND_INSTRUCTION}
		assert kind in templates, f'unknown ritual {kind!r}'
		settings = self.db.get_settings()
		instruction = templates[kind].format(owner=self.owner, weekday=local_now(now_utc, settings).strftime('%A'))
		history = self._history(self.db.recent_messages(80 if kind == 'weekly' else HISTORY_LIMIT))
		turns = _with_instruction(history, f'{kind} ritual', instruction)
		try:
			return await self.llm.complete(system=self._system(now_utc), messages=turns, effort='low')
		except LLMError as e:
			logger.warning('%s ritual failed: %s', kind, e)
			return None

	def sent_today(self, now_utc: datetime) -> int:
		local = local_now(now_utc, self.db.get_settings())
		since = local_day_start_utc(local).isoformat(timespec='seconds')
		return sum(1 for m in self.db.checkins_since(since) if m.kind == 'checkin')


def _with_instruction(turns: list[dict], label: str, instruction: str) -> list[dict]:
	"""Append an operator instruction as the final user turn (merged if the last turn is already the user's)."""
	text = f'[system: {label}]\n{instruction}'
	if turns and turns[-1]['role'] == 'user':
		turns[-1] = {'role': 'user', 'content': turns[-1]['content'] + '\n\n' + text}
	else:
		turns.append({'role': 'user', 'content': text})
	return turns


def _hours_since(now_utc: datetime, iso: str | None) -> str:
	then = parse_iso(iso)
	if then is None:
		return 'never'
	return f'{(now_utc - then).total_seconds() / 3600:.1f}'
