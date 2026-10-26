"""Pydantic models shared by the store, the mentor and the API."""

import re
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, available_timezones

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

MEMORY_KINDS = ('north_star', 'value', 'goal', 'project', 'idea', 'context', 'person', 'lesson', 'commitment')
LENSES = ('socrates', 'story_editor', 'producer', 'career_strategist', 'red_team', 'craft_coach', 'wellbeing')

MemoryKind = Literal['north_star', 'value', 'goal', 'project', 'idea', 'context', 'person', 'lesson', 'commitment']
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
	kind: Literal['chat', 'checkin', 'evening', 'weekly', 'ondemand']
	lens: str | None = None
	reason: str | None = None
	checkin_key: str | None = None
	feedback: int | None = None
	created_at: str


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


class MemoryUpdate(BaseModel):
	model_config = ConfigDict(extra='forbid')

	add: list[NewMemory]
	complete_ids: list[str]


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
	},
	'required': ['add', 'complete_ids'],
	'additionalProperties': False,
}
