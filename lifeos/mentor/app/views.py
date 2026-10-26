"""Pydantic models shared by the store, the mentor and the API."""

import re
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, available_timezones

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

MEMORY_KINDS = (
	'north_star',
	'value',
	'anti_goal',
	'goal',
	'strength',
	'blind_spot',
	'coaching_pref',
	'project',
	'idea',
	'context',
	'person',
	'lesson',
	'commitment',
)
LENSES = ('socrates', 'story_editor', 'producer', 'career_strategist', 'red_team', 'craft_coach', 'wellbeing')

MemoryKind = Literal[
	'north_star',
	'value',
	'anti_goal',
	'goal',
	'strength',
	'blind_spot',
	'coaching_pref',
	'project',
	'idea',
	'context',
	'person',
	'lesson',
	'commitment',
]

# The profile interview is done when each of these kinds has at least one entry.
INTERVIEW_TOPICS: dict[str, str] = {
	'north_star': 'the long-term direction: what they are ultimately working toward and why it matters to them',
	'value': 'their core values / principles, ideally ranked, with a real example of each',
	'anti_goal': 'anti-goals: what they refuse to become or trade away on the way',
	'goal': 'the 1-3 concrete outcomes for the next 90 days',
	'strength': "their strengths: what they are reliably good at, by their own and others' account",
	'blind_spot': 'blind spots and recurring patterns that derail them (procrastination triggers, overcommitting, travel days...)',
	'coaching_pref': 'how they want to be coached: directness, when to push, when to back off, what they hate in advice',
}

DEFAULT_INDICATORS = (
	{'name': 'Hours on own documentary project', 'unit': 'h', 'weekly_target': 5.0},
	{'name': 'Doc-industry contacts (pitches, labs, commissioners, peers)', 'unit': 'contacts', 'weekly_target': 1.0},
)
Lens = Literal['socrates', 'story_editor', 'producer', 'career_strategist', 'red_team', 'craft_coach', 'wellbeing']


def _valid_tz(value: str) -> str:
	assert value in available_timezones(), f'unknown timezone {value!r}'
	ZoneInfo(value)
	return value


def _hhmm(value: str) -> str:
	assert re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', value), f'expected HH:MM, got {value!r}'
	return value


TimeOfDay = Annotated[str, AfterValidator(_hhmm)]
TimezoneName = Annotated[str, AfterValidator(_valid_tz)]


class Settings(BaseModel):
	"""User-tunable behaviour. Stored as key/value rows; every field has a safe default."""

	model_config = ConfigDict(extra='ignore', validate_assignment=True)

	timezone: TimezoneName = 'Europe/Berlin'
	quiet_start: TimeOfDay = '21:30'
	quiet_end: TimeOfDay = '08:00'
	max_checkins_per_day: int = Field(default=3, ge=0, le=12)
	min_gap_hours: float = Field(default=3.0, ge=0.5, le=24)
	decision_interval_minutes: int = Field(default=90, ge=15, le=720)
	evening_reflection: TimeOfDay | Literal[''] = '20:30'
	weekly_review_day: int = Field(default=6, ge=0, le=6)  # Monday=0 ... Sunday=6
	weekly_review_time: TimeOfDay | Literal[''] = '18:00'
	focus_until: str = ''  # ISO timestamp (UTC); no proactive messages before it
	paused: bool = False
	interview_active: bool = False  # profile interview in progress: replies steer toward missing topics


class MemoryItem(BaseModel):
	id: str
	kind: MemoryKind
	text: str
	status: Literal['active', 'done', 'dropped']
	due_at: str | None = None
	source: str
	created_at: str
	updated_at: str


class Message(BaseModel):
	id: str
	role: Literal['user', 'mentor']
	content: str
	kind: Literal['chat', 'checkin', 'evening', 'weekly', 'ondemand', 'interview']
	lens: str | None = None
	reason: str | None = None
	checkin_key: str | None = None
	feedback: int | None = None
	created_at: str


class Indicator(BaseModel):
	"""A leading indicator for the current goals, measured per week (e.g. hours on own film)."""

	id: str
	name: str
	unit: str
	weekly_target: float
	active: bool
	created_at: str


class IndicatorProgress(BaseModel):
	id: str
	name: str
	unit: str
	target: float
	actual: float


class Scorecard(BaseModel):
	"""Deterministic weekly numbers; the LLM interprets them but never computes them."""

	week_start: str  # local Monday, YYYY-MM-DD
	week_end: str  # local Sunday
	days_elapsed: int  # 1..7 (7 for past weeks)
	indicators: list[IndicatorProgress]
	commitments_due: int
	commitments_done: int
	commitments_overdue: list[str]
	energy_avg: float | None
	energy_days: int
	checkins_rated: int
	checkins_useful: int

	@property
	def kept_rate(self) -> float | None:
		return self.commitments_done / self.commitments_due if self.commitments_due else None


# --- structured LLM outputs -----------------------------------------------


class CheckinDecision(BaseModel):
	model_config = ConfigDict(extra='forbid')

	send: bool
	lens: Lens
	reason: str  # why now, shown to the user
	message: str  # empty when send is false


class NewMemory(BaseModel):
	model_config = ConfigDict(extra='forbid')

	kind: MemoryKind
	text: str
	due_date: str  # YYYY-MM-DD for commitments, '' otherwise


class IndicatorLogIn(BaseModel):
	model_config = ConfigDict(extra='forbid')

	indicator_id: str
	value: float


class MemoryUpdate(BaseModel):
	model_config = ConfigDict(extra='forbid')

	add: list[NewMemory]
	complete_ids: list[str]
	log: list[IndicatorLogIn]


CHECKIN_SCHEMA = {
	'type': 'object',
	'properties': {
		'send': {'type': 'boolean'},
		'lens': {'type': 'string', 'enum': list(LENSES)},
		'reason': {'type': 'string'},
		'message': {'type': 'string'},
	},
	'required': ['send', 'lens', 'reason', 'message'],
	'additionalProperties': False,
}

MEMORY_UPDATE_SCHEMA = {
	'type': 'object',
	'properties': {
		'add': {
			'type': 'array',
			'items': {
				'type': 'object',
				'properties': {
					'kind': {'type': 'string', 'enum': list(MEMORY_KINDS)},
					'text': {'type': 'string'},
					'due_date': {'type': 'string'},
				},
				'required': ['kind', 'text', 'due_date'],
				'additionalProperties': False,
			},
		},
		'complete_ids': {'type': 'array', 'items': {'type': 'string'}},
		'log': {
			'type': 'array',
			'items': {
				'type': 'object',
				'properties': {'indicator_id': {'type': 'string'}, 'value': {'type': 'number'}},
				'required': ['indicator_id', 'value'],
				'additionalProperties': False,
			},
		},
	},
	'required': ['add', 'complete_ids', 'log'],
	'additionalProperties': False,
}
