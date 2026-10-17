"""Mock AI Provider for Testing, Diagnostics, and Offline Operation.

Provides deterministic responses and simulated token streaming without external network calls.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

from app.ai.base import (
    BaseAIProvider,
    ChatMessage,
    GenerateOptions,
    ProviderAvailability,
)


class MockAIProvider(BaseAIProvider):
    """Deterministic mock provider for testing and offline foundation mode."""

    def __init__(self, name: str = "mock", default_model: str = "mock-echo-v1") -> None:
        super().__init__(name)
        self.default_model = default_model

    async def check_availability(self) -> ProviderAvailability:
        return ProviderAvailability(
            provider_name=self.name,
            is_available=True,
            models=["mock-echo-v1", "mock-diagnostic-v1"],
            error_message=None,
        )

    async def generate(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> str:
        last_message = messages[-1].content if messages else "Hello"
        return f"[JARVIS Mock Provider] Acknowledged: \"{last_message}\". All core services are operating within normal parameters."

    async def stream(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate(messages, options)
        # Yield words in chunks to simulate token streaming
        words = full_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield chunk
            await asyncio.sleep(0.015)
