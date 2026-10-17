"""Voice Interaction API Endpoints (STT and TTS).

Implements PRD Section 12:
- Speech recognition transcription
- Text-to-speech audio synthesis
- Visible indicators and cancellation controls
"""

from __future__ import annotations

import base64
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, Field

from app.voice.stt import TranscriptionResult, get_stt_router
from app.voice.tts import get_tts_router

router = APIRouter(prefix="/voice", tags=["voice"])


class TranscribeRequest(BaseModel):
    audio_base64: str | None = None
    hint: str | None = None
    engine: str = Field(default="mock")


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    engine: str = Field(default="mock")


@router.get("/status", response_model=dict[str, Any])
def get_voice_status() -> dict[str, Any]:
    """Get status of speech recognition and synthesis engines."""
    return {
        "stt": {
            "default_engine": "mock",
            "available_engines": ["mock", "webspeech"],
            "ready": True,
        },
        "tts": {
            "default_engine": "mock",
            "available_engines": ["mock", "webspeech"],
            "ready": True,
        },
    }


@router.post("/transcribe", response_model=TranscriptionResult)
async def transcribe_audio(payload: TranscribeRequest) -> TranscriptionResult:
    """Transcribe speech audio into text."""
    audio_bytes = b""
    if payload.audio_base64:
        try:
            audio_bytes = base64.b64decode(payload.audio_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 audio payload",
            )

    stt_router = get_stt_router()
    adapter = stt_router.get_adapter(payload.engine)
    options = {}
    if payload.hint:
        options["hint"] = payload.hint

    return await adapter.transcribe(audio_bytes, options)


@router.post("/synthesize")
async def synthesize_speech(payload: SynthesizeRequest) -> Response:
    """Synthesize text into speech audio bytes (WAV)."""
    tts_router = get_tts_router()
    adapter = tts_router.get_adapter(payload.engine)
    audio_bytes, meta = await adapter.synthesize(
        text=payload.text,
        voice=payload.voice,
        speed=payload.speed,
    )

    return Response(
        content=audio_bytes,
        media_type=meta.content_type,
        headers={
            "X-Voice-Engine": meta.engine,
            "X-Audio-Duration": str(meta.duration_seconds),
        },
    )
