"""Background loop: rituals and proactive check-ins, with a heartbeat for dead-man monitoring."""

import asyncio
import logging
from datetime import UTC, datetime

import httpx

from app import learning
from app.db import DB
from app.mentor import Mentor
from app.notify import Notifier
from app.timing import base_gate, local_now, parse_iso, ritual_due, spontaneous_gate

logger = logging.getLogger(__name__)

PUSH_TITLES = {'checkin': 'Mentor', 'evening': 'Evening reflection', 'weekly': 'Weekly review'}
RITUAL_MOVES = {'evening': 'reflection_prompt', 'weekly': 'progress_check'}
DISTILL_HOURS = range(4, 7)  # local night window; the person model is rebuilt once a night from the full history


class Scheduler:
	def __init__(self, db: DB, mentor: Mentor, notifier: Notifier, tick_seconds: int, ping_url: str = ''):
		self.db = db
		self.mentor = mentor
		self.notifier = notifier
		self.tick_seconds = tick_seconds
		self.ping_url = ping_url

	async def run_forever(self) -> None:
		while True:
			try:
				await self.tick()
			except Exception:  # keep the loop alive; the heartbeat going stale is the alarm
				logger.exception('scheduler tick failed')
			await asyncio.sleep(self.tick_seconds)

	async def tick(self, now_utc: datetime | None = None) -> list[str]:
		"""One pass. Returns the kinds of messages sent (for tests and logs)."""
		now_utc = now_utc or datetime.now(UTC)
		sent: list[str] = []
		settings = self.db.get_settings()
		local = local_now(now_utc, settings)
		date_key = local.date().isoformat()

		if base_gate(now_utc, settings).ok:
			if ritual_due(local, settings.weekly_review_time, settings.weekly_review_day):
				iso = local.isocalendar()
				if await self._ritual('weekly', f'weekly:{iso.year}-W{iso.week:02d}', now_utc):
					sent.append('weekly')
			weekly_day = bool(settings.weekly_review_time) and local.weekday() == settings.weekly_review_day
			if not sent and not weekly_day and ritual_due(local, settings.evening_reflection):
				if await self._ritual('evening', f'evening:{date_key}', now_utc):
					sent.append('evening')

		if not sent:
			last_checkin = self.db.last_message('mentor', kinds=('checkin', 'ondemand', 'evening', 'weekly'))
			last_user = self.db.last_message('user')
			gate = spontaneous_gate(
				now_utc,
				settings,
				sent_today=self.mentor.sent_today(now_utc),
				last_checkin_at=parse_iso(last_checkin.created_at) if last_checkin else None,
				last_user_at=parse_iso(last_user.created_at) if last_user else None,
				last_decision_at=parse_iso(self.db.last_run('decision')),
			)
			slot = (
				learning.receptive_now(self.mentor.outcomes(now_utc), now_utc, settings.timezone, self.mentor.rng)
				if gate.ok
				else None
			)
			if slot and not slot.ok:
				# the timing learner says this slot rarely lands for this person; stay silent (it keeps sampling)
				self.db.mark_run('decision', f'low receptivity {slot.arm.key} ({slot.sampled:.2f})', at=now_utc)
			elif gate.ok:
				decision = await self.mentor.decide_checkin(now_utc)
				self.db.mark_run('decision', decision.reason if decision else 'error', at=now_utc)
				if decision and decision.send:
					n = self.mentor.sent_today(now_utc) + 1
					msg = self.db.add_message(
						'mentor',
						decision.message,
						kind='checkin',
						lens=decision.lens,
						reason=decision.reason,
						checkin_key=f'checkin:{date_key}:{n}',
						at=now_utc,
						move=decision.move,
					)
					if msg:
						await self.notifier.push(PUSH_TITLES['checkin'], decision.message, msg.id)
						sent.append('checkin')

		if local.hour in DISTILL_HOURS and not self.db.last_run(f'distill:{date_key}') and self._new_data_since_last_model():
			self.db.mark_run(f'distill:{date_key}', at=now_utc)
			if await self.mentor.distill(now_utc):
				sent.append('distill')

		self.db.mark_run('tick', ','.join(sent), at=now_utc)
		await self._ping()
		return sent

	async def _ritual(self, kind: str, key: str, now_utc: datetime) -> bool:
		if self.db.last_run(f'ritual:{key}'):
			return False  # already attempted for this period (sent, or failed and not retried)
		self.db.mark_run(f'ritual:{key}', at=now_utc)
		text = await self.mentor.write_ritual(kind, now_utc)
		if not text:
			return False
		msg = self.db.add_message('mentor', text, kind=kind, checkin_key=key, at=now_utc, move=RITUAL_MOVES.get(kind))
		if not msg:
			return False
		await self.notifier.push(PUSH_TITLES[kind], text, msg.id)
		return True

	def _new_data_since_last_model(self) -> bool:
		model = self.db.person_model()
		return self.db.message_count() > (model.data_messages if model else 0)

	async def _ping(self) -> None:
		if not self.ping_url:
			return
		try:
			async with httpx.AsyncClient(timeout=10.0) as client:
				await client.get(self.ping_url)
		except httpx.HTTPError as e:
			logger.warning('healthcheck ping failed: %s', e)
