"""Weekly scorecard: leading indicators vs target, commitments kept, energy, check-in usefulness.

All numbers are computed here, deterministically, in the user's local calendar week (Mon-Sun).
"""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.db import DB
from app.timing import local_now
from app.views import IndicatorProgress, Scorecard


def week_bounds(local_day: date) -> tuple[date, date]:
	start = local_day - timedelta(days=local_day.weekday())
	return start, start + timedelta(days=6)


def build_scorecard(db: DB, now_utc: datetime, weeks_ago: int = 0) -> Scorecard:
	assert weeks_ago >= 0
	settings = db.get_settings()
	today = local_now(now_utc, settings).date()
	start, end = week_bounds(today - timedelta(weeks=weeks_ago))
	last_counted = min(end, today)
	start_s, end_s, last_s = start.isoformat(), end.isoformat(), last_counted.isoformat()

	indicators = [
		IndicatorProgress(
			id=i.id, name=i.name, unit=i.unit, target=i.weekly_target, actual=db.indicator_total(i.id, start_s, end_s)
		)
		for i in db.list_indicators()
	]

	commitments = [m for m in db.list_memory(include_done=True) if m.kind == 'commitment' and m.due_at]
	due_this_week = [m for m in commitments if start_s <= m.due_at[:10] <= last_s and m.status != 'dropped']  # type: ignore[index]
	overdue = [m.text for m in commitments if m.status == 'active' and m.due_at[:10] < today.isoformat()]  # type: ignore[index]

	energies = db.energies(start_s, last_s)

	tz = ZoneInfo(settings.timezone)
	start_utc = datetime.combine(start, time.min, tz).astimezone(UTC).isoformat(timespec='seconds')
	end_utc = datetime.combine(end + timedelta(days=1), time.min, tz).astimezone(UTC).isoformat(timespec='seconds')
	rated = [
		m
		for m in db.messages_between(start_utc, end_utc)
		if m.role == 'mentor' and m.kind in ('checkin', 'evening', 'weekly') and m.feedback
	]

	return Scorecard(
		week_start=start_s,
		week_end=end_s,
		days_elapsed=(last_counted - start).days + 1,
		indicators=indicators,
		commitments_due=len(due_this_week),
		commitments_done=sum(1 for m in due_this_week if m.status == 'done'),
		commitments_overdue=overdue,
		energy_avg=round(sum(energies.values()) / len(energies), 1) if energies else None,
		energy_days=len(energies),
		checkins_rated=len(rated),
		checkins_useful=sum(1 for m in rated if m.feedback == 1),
	)


def format_scorecard(card: Scorecard) -> str:
	"""Compact text for the coach's context. Facts only."""
	lines = [f'Week {card.week_start}..{card.week_end} (day {card.days_elapsed} of 7):']
	for i in card.indicators:
		pace = i.target * card.days_elapsed / 7
		status = 'on pace' if i.actual >= pace else f'behind pace (expected ~{pace:.1f} by now)'
		lines.append(f'- {i.name}: {i.actual:g} / {i.target:g} {i.unit} — {status}')
	if not card.indicators:
		lines.append('- no leading indicators defined yet')
	if card.commitments_due:
		lines.append(f'- Commitments due this week: {card.commitments_done} of {card.commitments_due} done')
	if card.commitments_overdue:
		lines.append('- Overdue: ' + '; '.join(card.commitments_overdue))
	if card.energy_avg is not None:
		lines.append(f'- Energy: avg {card.energy_avg}/5 over {card.energy_days} day(s)')
	if card.checkins_rated:
		lines.append(f'- Your check-ins rated useful: {card.checkins_useful} of {card.checkins_rated}')
	return '\n'.join(lines)
