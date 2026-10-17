"""Text-to-Speech (TTS) Voice Adapters.

Implements PRD Section 12.2:
- Speech synthesis and audio generation
- Mock adapter generating valid WAV PCM audio
- Speed, pitch, and voice controls
"""

from __future__ import annotations

import io
import struct
import wave
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel

from app.utils.logging import logger


class SynthesisResult(BaseModel):
    content_type: str = "audio/wav"
    duration_seconds: float = 1.0
    engine: str = "mock"


class BaseTTSAdapter(ABC):
    """Abstract interface for Text-to-Speech adapters."""

    def __init__(self, name: str) -> None:
        self.name = name

    async def is_available(self) -> bool:
        """Check if engine is available."""
        return True

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: str | None = None,
        speed: float = 1.0,
    ) -> tuple[bytes, SynthesisResult]:
        """Synthesize text into audio bytes."""
        pass


class MockTTSAdapter(BaseTTSAdapter):
    """Deterministic TTS adapter generating valid WAV audio."""

    def __init__(self, name: str = "mock") -> None:
        super().__init__(name)

    async def synthesize(
        self,
        text: str,
        voice: str | None = None,
        speed: float = 1.0,
    ) -> tuple[bytes, SynthesisResult]:
        logger.info("MockTTSAdapter synthesizing: '%s' (speed=%.1f)", text[:50], speed)

        # Generate a valid short PCM 16-bit 8000Hz mono WAV file
        buffer = io.BytesIO()
        sample_rate = 8000
        duration = 0.5  # seconds
        num_samples = int(sample_rate * duration)

        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            # Create synthetic silent/tone PCM frames
            frames = bytearray()
            for i in range(num_samples):
                sample = int(500 * (1 if (i // 20) % 2 == 0 else -1))
                frames.extend(struct.pack("<h", sample))
            wav_file.writeframes(frames)

        audio_bytes = buffer.getvalue()
        result = SynthesisResult(
            content_type="audio/wav",
            duration_seconds=duration,
            engine=self.name,
        )
        return audio_bytes, result


class TTSRouter:
    """Registry and router for TTS engines."""

    def __init__(self) -> None:
        self._adapters: dict[str, BaseTTSAdapter] = {}
        self.register(MockTTSAdapter("mock"))

    def register(self, adapter: BaseTTSAdapter) -> None:
        self._adapters[adapter.name] = adapter

    def get_adapter(self, name: str = "mock") -> BaseTTSAdapter:
        return self._adapters.get(name) or self._adapters["mock"]


_tts_router: TTSRouter | None = None


def get_tts_router() -> TTSRouter:
    global _tts_router
    if _tts_router is None:
        _tts_router = TTSRouter()
    return _tts_router
