"""AI Provider Router and Fallback Orchestrator.

Manages provider discovery, active provider selection, and privacy-preserving
fallback routing in compliance with PRD Section 4.4 and SECURITY.md.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from app.ai.base import (
    BaseAIProvider,
    ChatMessage,
    GenerateOptions,
    ProviderAvailability,
)
from app.ai.mock import MockAIProvider
from app.ai.ollama import OllamaProvider
from app.ai.openai_compat import OpenAICompatibleProvider
from app.config import Settings, get_settings
from app.utils.logging import logger


class AIRouter:
    """Central registry and router for AI providers."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._providers: dict[str, BaseAIProvider] = {}
        self._init_providers()

    def _init_providers(self) -> None:
        # 1. Always register Mock provider for offline testing and diagnostics
        self.register(MockAIProvider(name="mock"))

        # 2. Register Ollama local model provider
        self.register(
            OllamaProvider(
                base_url=self.settings.local_model_base_url,
                default_model=self.settings.local_model_name,
                name="ollama",
            )
        )

        # 3. Register OpenAI-compatible provider
        self.register(
            OpenAICompatibleProvider(
                api_key=self.settings.openai_api_key,
                name="openai",
            )
        )

        # 4. Register OpenRouter provider (if key provided)
        if self.settings.openrouter_api_key:
            self.register(
                OpenAICompatibleProvider(
                    api_key=self.settings.openrouter_api_key,
                    base_url="https://openrouter.ai/api/v1",
                    default_model="meta-llama/llama-3.2-3b-instruct:free",
                    name="openrouter",
                )
            )

    def register(self, provider: BaseAIProvider) -> None:
        """Register a provider adapter."""
        self._providers[provider.name] = provider
        logger.debug("Registered AI provider: %s", provider.name)

    def get_provider(self, name: str | None = None) -> BaseAIProvider:
        """Get a provider by name, falling back to configured or mock provider."""
        provider_name = name or self.settings.ai_provider
        if provider_name in self._providers:
            return self._providers[provider_name]
        logger.warning("Requested provider '%s' not found. Falling back to 'mock'.", provider_name)
        return self._providers["mock"]

    async def list_provider_statuses(self) -> list[ProviderAvailability]:
        """Check availability across all registered providers."""
        results: list[ProviderAvailability] = []
        for provider in self._providers.values():
            status = await provider.check_availability()
            results.append(status)
        return results

    async def stream_with_fallback(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
        provider_name: str | None = None,
    ) -> tuple[AsyncGenerator[str, None], str]:
        """Stream response from primary provider with privacy-conscious fallback.

        Rule (SECURITY.md): Local requests NEVER silently fall back to cloud providers.
        """
        primary = self.get_provider(provider_name)
        active_model = (options and options.model) or getattr(primary, "default_model", primary.name)

        # Verify availability
        availability = await primary.check_availability()

        if availability.is_available:
            return primary.stream(messages, options), f"{primary.name}:{active_model}"

        # If primary provider is unavailable
        logger.warning(
            "Primary provider '%s' is unavailable: %s",
            primary.name,
            availability.error_message,
        )

        # Safe fallback in testing/development: fallback to Mock with clear disclosure
        if self.settings.env in ("development", "testing") and primary.name != "mock":
            mock = self.get_provider("mock")
            async def fallback_stream() -> AsyncGenerator[str, None]:
                yield f"[Notice: Provider '{primary.name}' unavailable ({availability.error_message}). Displaying local diagnostic response]\n\n"
                async for chunk in mock.stream(messages, options):
                    yield chunk
            return fallback_stream(), f"fallback:mock"

        # In production, do not silently disclose data to other providers
        async def unavailable_stream() -> AsyncGenerator[str, None]:
            yield (
                f"Error: Selected AI provider '{primary.name}' is currently unavailable.\n"
                f"Reason: {availability.error_message or 'Unknown connection error'}.\n"
                f"Please check your provider configuration or start the local model service."
            )

        return unavailable_stream(), f"{primary.name}:unavailable"


# Global router instance
_ai_router: AIRouter | None = None


def get_ai_router() -> AIRouter:
    global _ai_router
    if _ai_router is None:
        _ai_router = AIRouter()
    return _ai_router
