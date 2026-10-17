"""Chat and Conversation API Endpoints.

Implements conversation persistence and honest assistant responses
in compliance with PLAN.md Phase 1 Acceptance Criteria.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.conversation import Conversation, Message

router = APIRouter(prefix="/conversations", tags=["conversations"])


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class MessageRead(BaseModel):
    id: str
    role: str
    content: str
    model: str | None
    created_at: Any

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: str = Field(default="New Conversation", max_length=255)


class ConversationRead(BaseModel):
    id: str
    title: str
    model: str
    created_at: Any
    updated_at: Any
    messages: list[MessageRead] = []

    class Config:
        from_attributes = True


@router.get("", response_model=list[ConversationRead])
def list_conversations(db: Session = Depends(get_db)) -> list[Conversation]:
    """List all persisted conversations ordered by latest update."""
    stmt = select(Conversation).order_by(Conversation.updated_at.desc())
    return list(db.scalars(stmt).all())


@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
) -> Conversation:
    """Create a new conversation thread."""
    settings = get_settings()
    conv = Conversation(
        id=str(uuid.uuid4()),
        title=payload.title,
        model=settings.ai_provider,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
) -> Conversation:
    """Get a specific conversation thread with all its messages."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = db.scalars(stmt).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )
    return conv


@router.post("/{conversation_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
) -> Message:
    """Send a user message and receive an honest assistant response.
    
    Adheres strictly to Acceptance Criteria: No fake AI response is presented
    as a real model response.
    """
    settings = get_settings()
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = db.scalars(stmt).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )

    # 1. Save user message to SQLite
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        model=None,
    )
    db.add(user_msg)
    db.flush()

    # 2. Generate honest assistant response based on provider state
    if settings.ai_provider == "mock":
        response_text = (
            f"[Phase 1 Desktop Foundation — Local Echo Mode]\n"
            f"Received: \"{payload.content}\"\n\n"
            f"Status: Database persistence active. Live AI routing will be activated in Phase 2."
        )
        model_tag = "jarvis-foundation-mock"
    elif settings.ai_provider == "ollama" and not settings.local_model_enabled:
        response_text = (
            "Local model provider (Ollama) is configured but currently disabled or unavailable. "
            "Please start Ollama or configure a supported AI model in Settings."
        )
        model_tag = "offline"
    else:
        response_text = f"Provider '{settings.ai_provider}' is not yet initialized for inference in Phase 1."
        model_tag = settings.ai_provider

    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=response_text,
        model=model_tag,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
