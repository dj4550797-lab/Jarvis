"""OpenAI-Compatible AI Provider Adapter.

Supports OpenAI, OpenRouter, and standard OpenAI-compatible endpoints.
Complies with SECURITY.md and PRD 4.5.
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator

import httpx

from app.ai.base import (
    BaseAIProvider,
    ChatMessage,
    GenerateOptions,
    ProviderAvailability,
)
from app.utils.logging import logger


class OpenAICompatibleProvider(BaseAIProvider):
    """Adapter for OpenAI-compatible chat completion APIs."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.openai.com/v1",
        default_model: str = "gpt-4o-mini",
        name: str = "openai",
    ) -> None:
        super().__init__(name)
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    async def check_availability(self) -> ProviderAvailability:
        if not self.api_key:
            return ProviderAvailability(
                provider_name=self.name,
                is_available=False,
                models=[],
                error_message="API key not configured",
            )
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    models = [m["id"] for m in data.get("data", []) if "id" in m]
                    return ProviderAvailability(
                        provider_name=self.name,
                        is_available=True,
                        models=models[:10],
                        error_message=None,
                    )
                return ProviderAvailability(
                    provider_name=self.name,
                    is_available=False,
                    models=[],
                    error_message=f"Provider returned HTTP {res.status_code}",
                )
        except Exception as exc:
            return ProviderAvailability(
                provider_name=self.name,
                is_available=False,
                models=[],
                error_message=f"Failed to connect to provider: {exc}",
            )

    async def generate(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> str:
        chunks: list[str] = []
        async for chunk in self.stream(messages, options):
            chunks.append(chunk)
        return "".join(chunks)

    async def stream(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "OpenAI API key is not configured. Please set JARVIS_OPENAI_API_KEY."
            return

        model = (options and options.model) or self.default_model
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            "temperature": (options and options.temperature) or 0.7,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=8.0)) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        err = await response.aread()
                        logger.error("OpenAI provider error HTTP %d: %s", response.status_code, err)
                        yield f"OpenAI API error HTTP {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            item = json.loads(data_str)
                            delta = item.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                        except json.JSONDecodeError:
                            continue
        except Exception as exc:
            logger.error("Exception during OpenAI streaming: %s", exc)
            yield f"Cloud API request failure: {exc}"
