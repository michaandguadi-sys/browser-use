"""Push notifications: Web Push to the installed app, plus ntfy when it is configured."""

import logging

import httpx

from app.config import Config
from app.webpush import WebPush

logger = logging.getLogger(__name__)


class Notifier:
	def __init__(self, config: Config, webpush: WebPush | None = None):
		self._config = config
		self.webpush = webpush

	@property
	def ntfy_enabled(self) -> bool:
		return bool(self._config.ntfy_url and self._config.ntfy_topic)

	@property
	def enabled(self) -> bool:
		return self.ntfy_enabled or bool(self.webpush and self.webpush.has_subscribers)

	async def push(self, title: str, body: str, message_id: str, priority: int = 3) -> bool:
		"""Send one push to every channel. Returns whether any accepted it; never raises, so a push outage can't break the mentor."""
		delivered = (
			await self.webpush.send(title or 'Mentor', body, url=f'/#m={message_id}', tag=message_id) if self.webpush else 0
		)
		return await self._ntfy(title, body, message_id, priority) or delivered > 0

	async def _ntfy(self, title: str, body: str, message_id: str, priority: int) -> bool:
		if not self.ntfy_enabled:
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
