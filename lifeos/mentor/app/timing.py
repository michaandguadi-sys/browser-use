"""Deterministic attention gate: decides whether the mentor is even allowed to consider speaking.

The LLM only decides *whether it is worth it* after this gate passes, and never overrides it.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.views import Settings


@dataclass(frozen=True)
class GateResult:
	ok: bool
	reason: str


def parse_iso(value: str | None) -> datetime | None:
	if not value:
		return None
	parsed = datetime.fromisoformat(value)
	return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _hhmm(value: str) -> time:
	hours, minutes = value.split(':')
	return time(int(hours), int(minutes))


def local_now(now_utc: datetime, settings: Settings) -> datetime:
	return now_utc.astimezone(ZoneInfo(settings.timezone))


def in_quiet_hours(local: datetime, settings: Settings) -> bool:
	start, end, current = _hhmm(settings.quiet_start), _hhmm(settings.quiet_end), local.time()
	if start <= end:
		return start <= current < end
	return current >= start or current < end  # window wraps past midnight


def local_day_start_utc(local: datetime) -> datetime:
	return local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(UTC)


def base_gate(now_utc: datetime, settings: Settings) -> GateResult:
	"""Checks that apply to every proactive message, rituals included."""
	if settings.paused:
		return GateResult(False, 'paused')
	focus_until = parse_iso(settings.focus_until)
	if focus_until and now_utc < focus_until:
		return GateResult(False, 'focus mode')
	if in_quiet_hours(local_now(now_utc, settings), settings):
		return GateResult(False, 'quiet hours')
	return GateResult(True, 'ok')


def spontaneous_gate(
	now_utc: datetime,
	settings: Settings,
	sent_today: int,
	last_checkin_at: datetime | None,
	last_user_at: datetime | None,
	last_decision_at: datetime | None,
) -> GateResult:
	"""Extra limits for unprompted check-ins: daily budget, spacing, don't interrupt live chats."""
	base = base_gate(now_utc, settings)
	if not base.ok:
		return base
	if sent_today >= settings.max_checkins_per_day:
		return GateResult(False, 'daily budget used')
	if last_checkin_at and now_utc - last_checkin_at < timedelta(hours=settings.min_gap_hours):
		return GateResult(False, 'too soon after last check-in')
	if last_user_at and now_utc - last_user_at < timedelta(minutes=45):
		return GateResult(False, 'conversation in progress')
	if last_decision_at and now_utc - last_decision_at < timedelta(minutes=settings.decision_interval_minutes):
		return GateResult(False, 'decided recently')
	return GateResult(True, 'ok')


def ritual_due(local: datetime, at_hhmm: str, weekday: int | None = None) -> bool:
	"""True once the local clock has passed the ritual time (on the given weekday, if any)."""
	if not at_hhmm:
		return False
	if weekday is not None and local.weekday() != weekday:
		return False
	return local.time() >= _hhmm(at_hhmm)
