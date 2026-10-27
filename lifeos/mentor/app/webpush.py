"""Web Push (VAPID) straight to the installed app: notifications arrive as "Mentor", tap opens the app."""

import asyncio
import base64
import json
import logging
import os
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from pywebpush import WebPushException, webpush

from app.db import DB

logger = logging.getLogger(__name__)

TTL_SECONDS = 4 * 3600  # a check-in older than this is stale; let the push service drop it
GONE = (404, 410)  # subscription expired or the app was removed: forget it


def load_or_create_key(path: Path) -> ec.EllipticCurvePrivateKey:
	"""The VAPID key pair identifies this server to Apple/Google/Mozilla push services. Created once, kept in the data volume."""
	if path.is_file():
		key = serialization.load_pem_private_key(path.read_bytes(), password=None)
		assert isinstance(key, ec.EllipticCurvePrivateKey), 'VAPID key must be an EC key'
		return key
	key = ec.generate_private_key(ec.SECP256R1())
	path.parent.mkdir(parents=True, exist_ok=True)
	pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
	fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
	with os.fdopen(fd, 'wb') as f:
		f.write(pem)
	logger.info('created VAPID key at %s', path)
	return key


def b64url(data: bytes) -> str:
	return base64.urlsafe_b64encode(data).decode().rstrip('=')


class WebPush:
	def __init__(self, db: DB, key_path: Path, subject: str):
		assert subject.startswith(('https://', 'mailto:')), 'VAPID subject must be an https URL or mailto:'
		self.db = db
		self._key = load_or_create_key(key_path)
		self._private_der = b64url(
			self._key.private_bytes(serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
		)
		self._subject = subject
		self.public_key = b64url(
			self._key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
		)

	@property
	def has_subscribers(self) -> bool:
		return bool(self.db.list_push_subs())

	async def send(self, title: str, body: str, url: str = '/', tag: str = 'mentor') -> int:
		"""Push to every subscribed device. Returns how many accepted it; never raises."""
		payload = json.dumps({'title': title, 'body': _clip(body), 'url': url, 'tag': tag})
		results = await asyncio.gather(*(asyncio.to_thread(self._send_one, sub, payload) for sub in self.db.list_push_subs()))
		return sum(results)

	def _send_one(self, sub: dict[str, str], payload: str) -> bool:
		info = {'endpoint': sub['endpoint'], 'keys': {'p256dh': sub['p256dh'], 'auth': sub['auth']}}
		try:
			webpush(
				info,
				data=payload,
				vapid_private_key=self._private_der,
				vapid_claims={'sub': self._subject},  # fresh dict per call: pywebpush writes aud/exp into it
				ttl=TTL_SECONDS,
				timeout=15,
				headers={'Urgency': 'normal'},
			)
		except WebPushException as e:
			status = e.response.status_code if e.response is not None else None
			if status in GONE:
				self.db.delete_push_sub(sub['endpoint'])
				logger.info('removed expired push subscription (%s)', status)
			else:
				logger.warning('web push failed (%s): %s', status, e)
			return False
		except Exception as e:  # network errors etc.: a push outage must not break the mentor
			logger.warning('web push failed: %s', e)
			return False
		return True


def _clip(text: str, limit: int = 240) -> str:
	text = ' '.join(text.split())
	return text if len(text) <= limit else text[: limit - 1].rstrip() + '…'
