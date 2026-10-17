"""Abstract Base Interface for JARVIS AI Providers.

Complies with JARVIS_Master_PRD.md Section 4.4 and 4.5.
All providers must implement common generate, stream, availability check,
and model discovery methods.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ChatMessage:
    """Standard message representation for model interaction."""
    role: str  # "user" | "assistant" | "system"
    content: str


@dataclass
class GenerateOptions:
    """Options for AI text generation."""
    model: str | None = None
    temperature: float = 0.7
    max_tokens: int = 2048
    stop_sequences: list[str] = field(default_factory=list)


@dataclass
class ProviderAvailability:
    """Status report on provider availability and available models."""
    provider_name: str
    is_available: bool
    models: list[str] = field(default_factory=list)
    error_message: str | None = None


class BaseAIProvider(ABC):
    """Abstract base class for all JARVIS AI provider adapters."""

    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    async def check_availability(self) -> ProviderAvailability:
        """Check if the provider service is reachable and return available models."""
        pass

    @abstractmethod
    async def generate(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> str:
        """Generate a complete text response synchronously from the model."""
        pass

    @abstractmethod
    async def stream(
        self,
        messages: list[ChatMessage],
        options: GenerateOptions | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens as they become available."""
        pass
