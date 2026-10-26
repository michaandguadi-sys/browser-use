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
	INTERVIEW_START_INSTRUCTION,
	INTERVIEW_STEER,
	ONDEMAND_INSTRUCTION,
	SYSTEM_PROMPT,
	WEEKLY_INSTRUCTION,
)
from app.scorecard import build_scorecard, format_scorecard
from app.timing import local_day_start_utc, local_now, parse_iso
from app.views import (
	CHECKIN_SCHEMA,
	INTERVIEW_TOPICS,
	MEMORY_UPDATE_SCHEMA,
	CheckinDecision,
	MemoryItem,
	MemoryUpdate,
	Message,
)

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
			scorecard=format_scorecard(build_scorecard(self.db, now_utc)),
			energy_today=self._energy_today(now_utc),
			interview=self._interview_line(),
		)
		return [
			{'type': 'text', 'text': self._system_prompt, 'cache_control': {'type': 'ephemeral'}},
			{'type': 'text', 'text': context},
		]

	def _today(self, now_utc: datetime) -> str:
		return local_now(now_utc, self.db.get_settings()).date().isoformat()

	def _energy_today(self, now_utc: datetime) -> str:
		energy = self.db.energies(self._today(now_utc), self._today(now_utc))
		return f'{next(iter(energy.values()))}/5' if energy else 'not logged'

	def missing_topics(self) -> list[str]:
		known = {m.kind for m in self.db.list_memory()}
		return [topic for topic in INTERVIEW_TOPICS if topic not in known]

	def _interview_line(self) -> str:
		missing = self.missing_topics()
		if not missing:
			return ''
		state = 'IN PROGRESS' if self.db.get_settings().interview_active else 'not started/paused'
		return f'Profile interview ({state}); topics not yet known: {", ".join(missing)}\n'

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

	async def reply(self, text: str, now_utc: datetime | None = None) -> tuple[Message, Message, list[MemoryItem], list[dict]]:
		"""Store the user's message, answer it, then update memory and indicator logs from the exchange."""
		now_utc = now_utc or datetime.now(UTC)
		text = text.strip()
		assert text, 'message must not be empty'
		user_msg = self.db.add_message('user', text, at=now_utc)
		assert user_msg is not None
		turns = self._history(self.db.recent_messages(HISTORY_LIMIT))
		missing = self.missing_topics()
		interviewing = self.db.get_settings().interview_active and bool(missing)
		if interviewing:
			steer = INTERVIEW_STEER.format(missing=', '.join(f'{t} ({INTERVIEW_TOPICS[t]})' for t in missing))
			turns = _with_instruction(turns, 'interview', steer)
		try:
			answer = await self.llm.complete(system=self._system(now_utc), messages=turns, effort='medium')
		except LLMError as e:
			logger.warning('reply failed: %s', e)
			answer = f'(I could not reach my brain just now: {e}. Your message is saved; try again in a minute.)'
		mentor_msg = self.db.add_message('mentor', answer, kind='interview' if interviewing else 'chat', at=now_utc)
		assert mentor_msg is not None
		added, logged = await self.update_memory(user_msg, mentor_msg, now_utc)
		if self.db.get_settings().interview_active and not self.missing_topics():
			self.db.update_settings(interview_active=False)
		return user_msg, mentor_msg, added, logged

	async def update_memory(
		self, user_msg: Message, mentor_msg: Message, now_utc: datetime
	) -> tuple[list[MemoryItem], list[dict]]:
		existing = self.db.list_memory()
		indicators = self.db.list_indicators()
		prompt = EXTRACT_INSTRUCTION.format(
			owner=self.owner,
			today=self._today(now_utc),
			indicators='\n'.join(f'{i.id}: {i.name} [{i.unit}]' for i in indicators) or '(none)',
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
			return [], []
		valid_ids = {m.id for m in existing if m.kind == 'commitment'}
		for item_id in update.complete_ids:
			if item_id in valid_ids:
				self.db.update_memory(item_id, status='done')
		added = []
		for new in update.add:
			if new.text.strip():
				added.append(self.db.add_memory(new.kind, new.text, source='conversation', due_at=new.due_date or None))
		by_id = {i.id: i for i in indicators}
		logged = []
		for entry in update.log:
			indicator = by_id.get(entry.indicator_id)
			if indicator and 0 < entry.value <= 1000:
				self.db.log_indicator(
					indicator.id, self._today(now_utc), entry.value, source='conversation', note=user_msg.content[:200]
				)
				logged.append(
					{'indicator_id': indicator.id, 'name': indicator.name, 'unit': indicator.unit, 'value': entry.value}
				)
		return added, logged

	async def start_interview(self, now_utc: datetime) -> Message | None:
		"""Begin (or continue) the profile interview with the next question, or a summary when complete."""
		missing = self.missing_topics()
		self.db.update_settings(interview_active=bool(missing))
		instruction = INTERVIEW_START_INSTRUCTION.format(
			owner=self.owner, missing='\n'.join(f'- {t}: {INTERVIEW_TOPICS[t]}' for t in missing) or '(none: all topics known)'
		)
		turns = _with_instruction(self._history(self.db.recent_messages(HISTORY_LIMIT)), 'interview', instruction)
		try:
			text = await self.llm.complete(system=self._system(now_utc), messages=turns, effort='medium')
		except LLMError as e:
			logger.warning('interview start failed: %s', e)
			return None
		return self.db.add_message('mentor', text, kind='interview', reason='profile interview', at=now_utc)

	# --- proactive ----------------------------------------------------------

	def _signal(self, now_utc: datetime) -> str:
		memory = self.db.list_memory()
		if not any(m.kind == 'value' for m in memory):
			return 'Their values are not in memory yet: onboarding. Ask one deep, open question about what matters most to them.'
		today = local_now(now_utc, self.db.get_settings()).date().isoformat()
		signals = []
		due = [m for m in memory if m.kind == 'commitment' and m.due_at and m.due_at <= today]
		if due:
			signals.append('Commitment due or overdue: ' + '; '.join(f'"{m.text}" (due {m.due_at})' for m in due))
		card = build_scorecard(self.db, now_utc)
		if card.days_elapsed >= 4:  # from Thursday on, a pace gap is still fixable this week
			for i in card.indicators:
				if i.target and i.actual < 0.5 * i.target * card.days_elapsed / 7:
					signals.append(
						f'Behind on "{i.name}": {i.actual:g} of {i.target:g} {i.unit} this week, day {card.days_elapsed}'
					)
		energy = self.db.energies(today, today)
		if energy and next(iter(energy.values())) <= 2:
			signals.append('Energy logged low today (<=2/5): prefer care over push, or stay silent')
		return ' | '.join(signals) or 'none'

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
