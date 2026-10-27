"""Runtime configuration, read once from environment variables (see ../../.env.example)."""

import os

from pydantic import BaseModel, ConfigDict, Field


class Config(BaseModel):
	model_config = ConfigDict(extra='forbid')

	owner_name: str = 'Micha'
	passphrase: str = Field(min_length=8)
	session_secret: str = Field(min_length=16)
	db_path: str = './mentor.db'
	public_url: str = 'http://localhost:8000'
	cookie_secure: bool = False

	anthropic_api_key: str = ''
	model: str = 'claude-opus-5-5'

	ntfy_url: str = ''
	ntfy_topic: str = ''
	ntfy_token: str = ''
	ntfy_public_url: str = ''  # what the phone's ntfy app subscribes to

	vapid_key_path: str = ''  # default: vapid_private.pem next to the database

	healthcheck_ping_url: str = ''
	tick_seconds: int = Field(default=300, ge=10)
	seed_path: str = ''


def load_config() -> Config:
	env = os.environ
	public_url = env.get('PUBLIC_URL', 'http://localhost:8000').rstrip('/')
	return Config(
		owner_name=env.get('OWNER_NAME', 'Micha'),
		passphrase=env['MENTOR_PASSPHRASE'],
		session_secret=env['SESSION_SECRET'],
		db_path=env.get('DB_PATH', './mentor.db'),
		public_url=public_url,
		cookie_secure=public_url.startswith('https://'),
		anthropic_api_key=env.get('ANTHROPIC_API_KEY', ''),
		model=env.get('MENTOR_MODEL', 'claude-opus-5-5'),
		ntfy_url=env.get('NTFY_URL', '').rstrip('/'),
		ntfy_topic=env.get('NTFY_TOPIC', ''),
		ntfy_token=env.get('NTFY_TOKEN', ''),
		ntfy_public_url=env.get('NTFY_PUBLIC_URL', '').rstrip('/'),
		vapid_key_path=env.get('VAPID_KEY_PATH', ''),
		healthcheck_ping_url=env.get('HEALTHCHECK_PING_URL', ''),
		tick_seconds=int(env.get('TICK_SECONDS', '300')),
		seed_path=env.get('SEED_PATH', ''),
	)
