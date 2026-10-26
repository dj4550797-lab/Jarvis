"""Model Generation and Inference REST API Router (Phase 3)."""

from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from jarvis.ai.engine import model_engine

router = APIRouter(prefix="/models", tags=["Models"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Prompt text for local model generation")
    system_prompt: str = Field(default="You are JARVIS, an autonomous personal AI assistant.")
    max_tokens: int = Field(default=512, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class GenerateResponse(BaseModel):
    prompt: str
    response: str
    model: str
    mode: str


@router.post("/generate", response_model=GenerateResponse)
async def generate_text(req: GenerateRequest) -> GenerateResponse:
    """Generate completion using the local offline model engine."""
    result = await model_engine.generate(
        prompt=req.prompt,
        system_prompt=req.system_prompt,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
    )
    info = model_engine.get_info()
    return GenerateResponse(
        prompt=req.prompt,
        response=result,
        model=info["active_model"] or "default",
        mode=info["mode"],
    )


@router.get("/info")
async def get_model_info() -> dict[str, Any]:
    """Retrieve local model engine metadata."""
    return model_engine.get_info()
