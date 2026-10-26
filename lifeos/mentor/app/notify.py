"""Push notifications via ntfy (self-hosted in the compose stack, or any ntfy server)."""

import logging

import httpx

from app.config import Config

logger = logging.getLogger(__name__)


class Notifier:
	def __init__(self, config: Config):
		self._config = config

	@property
	def enabled(self) -> bool:
		return bool(self._config.ntfy_url and self._config.ntfy_topic)

	async def push(self, title: str, body: str, message_id: str, priority: int = 3) -> bool:
		"""Send one push. Returns False (never raises) so a push outage can't break the mentor."""
		if not self.enabled:
			return False
		payload = {
			'topic': self._config.ntfy_topic,
			'title': title or 'Mentor',
			'message': body,
			'click': f'{self._config.public_url}/#m={message_id}',
			'priority': priority,
			'tags': ['thought_balloon'],
		}
		headers = {'Authorization': f'Bearer {self._config.ntfy_token}'} if self._config.ntfy_token else {}
		try:
			async with httpx.AsyncClient(timeout=15.0) as client:
				# JSON publishing to the server root keeps UTF-8 titles intact (headers can't carry them).
				response = await client.post(self._config.ntfy_url, json=payload, headers=headers)
			response.raise_for_status()
		except httpx.HTTPError as e:
			logger.warning('ntfy push failed: %s', e)
			return False
		return True
