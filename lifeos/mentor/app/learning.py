"""Per-person learning from outcomes: when this person is receptive, and which coaching moves work for them.

Every proactive message is a small experiment, as in micro-randomized trials (Klasnja et al. 2015): it has a time
slot and a move, and an outcome (a reply within REPLY_WINDOW, or explicit timing feedback). Beta-Bernoulli posteriors
per slot and per move, sampled with Thompson sampling, keep exploring while favouring what works. Pure functions over
the message log, so they can be recomputed at any time, from any history.
"""

import bisect
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.timing import parse_iso
from app.views import MOVES, Message

REPLY_WINDOW = timedelta(minutes=90)
PROACTIVE_KINDS = ('checkin', 'evening', 'weekly')  # "ondemand" is user-initiated, not an experiment
BLOCKS = tuple(range(6, 24, 2))  # local 2-hour blocks starting 06:00 ... 22:00
MIN_TRIES_BEFORE_SKIPPING = 4  # below this, always explore the slot
SKIP_BELOW = 0.2  # sampled receptivity under this: stay silent now


@dataclass(frozen=True)
class Outcome:
	message_id: str
	at: datetime
	kind: str
	move: str | None
	tz: str | None
	success: bool  # for timing: replied, or rated "good timing"
	replied: bool  # for moves: only real replies count, never ratings (ratings reward flattery)
	feedback: int | None


@dataclass(frozen=True)
class Arm:
	key: str
	successes: int
	failures: int

	@property
	def tries(self) -> int:
		return self.successes + self.failures

	@property
	def mean(self) -> float:
		return (self.successes + 1) / (self.tries + 2)  # posterior mean under a uniform Beta(1, 1) prior

	def sample(self, rng: random.Random) -> float:
		return rng.betavariate(self.successes + 1, self.failures + 1)


def outcomes(messages: list[Message], now: datetime) -> list[Outcome]:
	"""One outcome per proactive mentor message whose reply window has closed (or that got feedback)."""
	user_times = sorted(t for m in messages if m.role == 'user' and (t := parse_iso(m.created_at)))
	result = []
	for m in messages:
		if m.role != 'mentor' or m.kind not in PROACTIVE_KINDS:
			continue
		at = parse_iso(m.created_at)
		assert at is not None
		i = bisect.bisect_right(user_times, at)
		replied = i < len(user_times) and user_times[i] <= at + REPLY_WINDOW
		if not replied and m.feedback is None and now < at + REPLY_WINDOW:
			continue  # still open
		success = m.feedback == 1 or (m.feedback != -1 and replied)
		result.append(Outcome(m.id, at, m.kind, m.move, m.tz, success, replied, m.feedback))
	return result


def slot_key(at: datetime, tz: str) -> str:
	local = at.astimezone(ZoneInfo(tz))
	day = 'weekend' if local.weekday() >= 5 else 'weekday'
	block = max(b for b in BLOCKS if b <= local.hour) if local.hour >= BLOCKS[0] else BLOCKS[0]
	return f'{day}:{block:02d}'


def _arms(keys: list[str], results: list[tuple[str, bool]]) -> dict[str, Arm]:
	counts = {k: [0, 0] for k in keys}
	for key, ok in results:
		counts.setdefault(key, [0, 0])[0 if ok else 1] += 1
	return {k: Arm(k, s, f) for k, (s, f) in counts.items()}


def receptivity(history: list[Outcome], tz: str) -> dict[str, Arm]:
	keys = [f'{d}:{b:02d}' for d in ('weekday', 'weekend') for b in BLOCKS]
	# each experiment is bucketed by the local time where the person was then, so travelling doesn't scramble it
	return _arms(keys, [(slot_key(o.at, o.tz or tz), o.success) for o in history])


def move_stats(history: list[Outcome]) -> dict[str, Arm]:
	return _arms(list(MOVES), [(o.move, o.replied) for o in history if o.move in MOVES])


@dataclass(frozen=True)
class SlotDecision:
	ok: bool
	sampled: float
	arm: Arm


def receptive_now(history: list[Outcome], now: datetime, tz: str, rng: random.Random) -> SlotDecision:
	"""Thompson-sample this slot's receptivity; under-tested slots are always explored."""
	arm = receptivity(history, tz)[slot_key(now, tz)]
	sampled = arm.sample(rng)
	return SlotDecision(arm.tries < MIN_TRIES_BEFORE_SKIPPING or sampled >= SKIP_BELOW, sampled, arm)


def suggest_move(history: list[Outcome], rng: random.Random, exclude: tuple[str, ...] = ()) -> str:
	"""The move with the highest Thompson sample: mostly what works for this person, sometimes something new."""
	stats = move_stats(history)
	candidates = [m for m in MOVES if m not in exclude]
	return max(candidates, key=lambda m: stats[m].sample(rng))


def summary(history: list[Outcome], tz: str) -> dict:
	"""For the UI and the mentor's context."""
	rec = receptivity(history, tz)
	moves = move_stats(history)
	return {
		'experiments': len(history),
		'reply_rate': round(sum(o.success for o in history) / len(history), 2) if history else None,
		'slots': [{'slot': a.key, 'tries': a.tries, 'rate': round(a.mean, 2)} for a in rec.values()],
		'moves': sorted(
			({'move': a.key, 'tries': a.tries, 'rate': round(a.mean, 2), 'what': MOVES[a.key]} for a in moves.values()),
			key=lambda x: (x['tries'] == 0, -x['rate']),
		),
	}


def format_for_prompt(history: list[Outcome], tz: str) -> str:
	if not history:
		return 'No outcomes yet: every slot and move is untested. Explore.'
	moves = [a for a in move_stats(history).values() if a.tries]
	moves.sort(key=lambda a: -a.mean)
	slots = [a for a in receptivity(history, tz).values() if a.tries >= 2]
	slots.sort(key=lambda a: -a.mean)
	lines = [
		f'{len(history)} proactive messages so far, {sum(o.success for o in history)} landed (reply within 90 min or "good timing"); moves are judged on replies only.'
	]
	if moves:
		lines.append('Moves (landed/tried): ' + ', '.join(f'{a.key} {a.successes}/{a.tries}' for a in moves))
	if slots:
		lines.append('Best slots: ' + ', '.join(f'{a.key}h {a.mean:.0%}' for a in slots[:3]))
		lines.append('Worst slots: ' + ', '.join(f'{a.key}h {a.mean:.0%}' for a in slots[-2:]))
	return '\n'.join(lines)
