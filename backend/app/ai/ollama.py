"""Ollama Local Model Provider Adapter.

Complies with JARVIS_Master_PRD.md Section 4.4:
- Local-first inference via loopback endpoint
- Availability and model discovery via /api/tags
- Real-time token streaming via /api/chat
- Graceful error handling when Ollama is offline
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


class OllamaProvider(BaseAIProvider):
    """Adapter for local inference using Ollama."""

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434",
        default_model: str = "llama3.2:latest",
        name: str = "ollama",
    ) -> None:
        super().__init__(name)
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    async def check_availability(self) -> ProviderAvailability:
        """Check if local Ollama service is reachable and query installed models."""
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", []) if m.get("name")]
                    return ProviderAvailability(
                        provider_name=self.name,
                        is_available=True,
                        models=models,
                        error_message=None,
                    )
                return ProviderAvailability(
                    provider_name=self.name,
                    is_available=False,
                    models=[],
                    error_message=f"Ollama returned HTTP {res.status_code}",
                )
        except Exception as exc:
            return ProviderAvailability(
                provider_name=self.name,
                is_available=False,
                models=[],
                error_message=f"Local model runtime unreachable: {exc}",
            )

    async def generate(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> str:
        """Generate response via Ollama /api/chat."""
        chunks: list[str] = []
        async for chunk in self.stream(messages, options):
            chunks.append(chunk)
        return "".join(chunks)

    async def stream(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens from Ollama /api/chat."""
        model = (options and options.model) or self.default_model
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            "options": {
                "temperature": (options and options.temperature) or 0.7,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0)) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error("Ollama streaming error HTTP %d: %s", response.status_code, error_text)
                        yield f"Ollama error: HTTP {response.status_code} - {error_text.decode('utf-8', errors='replace')}"
                        return

                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            item = json.loads(line)
                            delta = item.get("message", {}).get("content", "")
                            if delta:
                                yield delta
                            if item.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except httpx.ConnectError:
            yield "Local model runtime (Ollama) is not running on 127.0.0.1:11434. Please start Ollama."
        except Exception as exc:
            logger.error("Exception during Ollama generation: %s", exc)
            yield f"Ollama connection failure: {exc}"
