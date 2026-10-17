"""Speech-to-Text (STT) Voice Adapters.

Implements PRD Section 12.1:
- Speech recognition and transcription
- Mock adapter for deterministic testing
- Multi-engine routing
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field

from app.utils.logging import logger


class TranscriptionResult(BaseModel):
    text: str
    confidence: float = 1.0
    language: str = "en"
    duration_seconds: float = 0.0
    engine: str = "mock"
    is_final: bool = True


class BaseSTTAdapter(ABC):
    """Abstract interface for Speech-to-Text adapters."""

    def __init__(self, name: str) -> None:
        self.name = name

    async def is_available(self) -> bool:
        """Check if engine is available."""
        return True

    @abstractmethod
    async def transcribe(self, audio_data: bytes, options: dict[str, Any] | None = None) -> TranscriptionResult:
        """Transcribe raw audio bytes into text."""
        pass


class MockSTTAdapter(BaseSTTAdapter):
    """Deterministic STT adapter for testing and offline foundation mode."""

    def __init__(self, name: str = "mock") -> None:
        super().__init__(name)

    async def transcribe(self, audio_data: bytes, options: dict[str, Any] | None = None) -> TranscriptionResult:
        logger.info("MockSTTAdapter received %d bytes of audio data", len(audio_data))
        # Deterministic transcription based on input or mock fallback
        text = "Initiate JARVIS diagnostics and check system health."
        if options and "hint" in options:
            text = str(options["hint"])

        return TranscriptionResult(
            text=text,
            confidence=0.98,
            language="en",
            duration_seconds=1.5,
            engine=self.name,
        )


class STTRouter:
    """Registry and router for STT engines."""

    def __init__(self) -> None:
        self._adapters: dict[str, BaseSTTAdapter] = {}
        self.register(MockSTTAdapter("mock"))

    def register(self, adapter: BaseSTTAdapter) -> None:
        self._adapters[adapter.name] = adapter

    def get_adapter(self, name: str = "mock") -> BaseSTTAdapter:
        return self._adapters.get(name) or self._adapters["mock"]


_stt_router: STTRouter | None = None


def get_stt_router() -> STTRouter:
    global _stt_router
    if _stt_router is None:
        _stt_router = STTRouter()
    return _stt_router
