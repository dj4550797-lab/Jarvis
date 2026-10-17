"""JARVIS AI Providers Package."""

from app.ai.base import (
    BaseAIProvider,
    ChatMessage,
    GenerateOptions,
    ProviderAvailability,
)
from app.ai.mock import MockAIProvider
from app.ai.ollama import OllamaProvider
from app.ai.openai_compat import OpenAICompatibleProvider
from app.ai.router import AIRouter, get_ai_router

__all__ = [
    "AIRouter",
    "BaseAIProvider",
    "ChatMessage",
    "GenerateOptions",
    "MockAIProvider",
    "OllamaProvider",
    "OpenAICompatibleProvider",
    "ProviderAvailability",
    "get_ai_router",
]
