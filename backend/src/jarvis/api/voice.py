"""Voice Processing and State Machine REST API Router (Phase 3)."""

from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from jarvis.voice.engine import VoiceStateType, voice_engine

router = APIRouter(prefix="/voice", tags=["Voice Engine"])


class VoiceStateUpdate(BaseModel):
    state: VoiceStateType = Field(..., description="Target voice state: idle, listening, processing, speaking, error")


class VoiceProcessRequest(BaseModel):
    utterance: str = Field(..., min_length=1, description="Recognized speech text to process")


@router.get("/state")
async def get_voice_state() -> dict[str, Any]:
    """Retrieve current voice engine state and parameters."""
    return voice_engine.get_info()


@router.post("/state")
async def update_voice_state(req: VoiceStateUpdate) -> dict[str, Any]:
    """Update voice engine state."""
    await voice_engine.set_state(req.state)
    return {"status": "updated", "current_state": voice_engine.state}


@router.post("/process")
async def process_voice_utterance(req: VoiceProcessRequest) -> dict[str, Any]:
    """Execute complete voice pipeline for given utterance."""
    return await voice_engine.process_utterance(req.utterance)
