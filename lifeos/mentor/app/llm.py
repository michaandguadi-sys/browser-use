"""Thin async wrapper around the Claude API so the mentor logic stays testable."""

import logging
from typing import Any, Protocol

import anthropic

logger = logging.getLogger(__name__)


class LLMError(Exception):
	pass


class LLM(Protocol):
	async def complete(
		self,
		*,
		system: list[dict[str, Any]],
		messages: list[dict[str, Any]],
		effort: str = 'medium',
		schema: dict[str, Any] | None = None,
		max_tokens: int = 16000,
	) -> str: ...


class ClaudeLLM:
	def __init__(self, api_key: str, model: str):
		assert api_key, 'ANTHROPIC_API_KEY is required'
		self._client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=3, timeout=120.0)
		self._model = model

	async def complete(
		self,
		*,
		system: list[dict[str, Any]],
		messages: list[dict[str, Any]],
		effort: str = 'medium',
		schema: dict[str, Any] | None = None,
		max_tokens: int = 16000,
	) -> str:
		output_config: dict[str, Any] = {'effort': effort}
		if schema is not None:
			output_config['format'] = {'type': 'json_schema', 'schema': schema}
		try:
			response = await self._client.beta.messages.create(
				model=self._model,
				max_tokens=max_tokens,
				system=system,  # type: ignore[arg-type]
				messages=messages,  # type: ignore[arg-type]
				output_config=output_config,  # type: ignore[arg-type]
				betas=['server-side-fallback-2026-07-01'],
				fallbacks='default',  # type: ignore[arg-type]
			)
		except anthropic.APIStatusError as e:
			raise LLMError(f'Claude API error {e.status_code}: {e.message}') from e
		except anthropic.APIConnectionError as e:
			raise LLMError(f'Claude API unreachable: {e}') from e
		if response.stop_reason == 'refusal':
			raise LLMError('Claude declined this request')
		text = ''.join(block.text for block in response.content if block.type == 'text').strip()
		self._log_usage(response.usage)
		if not text:
			raise LLMError(f'empty response (stop_reason={response.stop_reason})')
		return text

	@staticmethod
	def _log_usage(usage: Any) -> None:
		logger.info(
			'claude usage: in=%s cache_read=%s out=%s',
			getattr(usage, 'input_tokens', '?'),
			getattr(usage, 'cache_read_input_tokens', '?'),
			getattr(usage, 'output_tokens', '?'),
		)
