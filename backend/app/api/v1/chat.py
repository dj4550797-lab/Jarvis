"""Chat, Conversation, and Real-Time Streaming Endpoints.

Implements:
- Conversation CRUD and persistence in SQLite
- Provider discovery and model listing
- Server-Sent Events (SSE) token streaming via /stream
- Fallback routing and honest status tags per PRD 4.4, 4.5 and PLAN.md Phase 2
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.base import ChatMessage, GenerateOptions, ProviderAvailability
from app.ai.router import get_ai_router
from app.config import get_settings
from app.database import get_db, get_session_factory
from app.memory.service import MemoryService
from app.models.conversation import Conversation, Message
from app.utils.logging import logger

router = APIRouter(prefix="/conversations", tags=["conversations"])


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    provider: str | None = None
    model: str | None = None


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
    model: str | None = None


class ConversationRead(BaseModel):
    id: str
    title: str
    model: str
    created_at: Any
    updated_at: Any
    messages: list[MessageRead] = []

    class Config:
        from_attributes = True


@router.get("/providers", response_model=list[dict[str, Any]])
async def list_providers() -> list[dict[str, Any]]:
    """List all registered AI providers, availability, and discovered models."""
    ai_router = get_ai_router()
    statuses = await ai_router.list_provider_statuses()
    return [
        {
            "name": s.provider_name,
            "available": s.is_available,
            "models": s.models,
            "error": s.error_message,
        }
        for s in statuses
    ]


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
        model=payload.model or settings.ai_provider,
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


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a conversation thread and all its messages."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = db.scalars(stmt).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )
    db.delete(conv)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{conversation_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
) -> Message:
    """Send a user message and receive a complete assistant response synchronously."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = db.scalars(stmt).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )

    # 1. Save user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        model=None,
    )
    db.add(user_msg)
    db.commit()

    # 2. Collect conversation history
    history_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    history_msgs = list(db.scalars(history_stmt).all())
    chat_context = [ChatMessage(role=m.role, content=m.content) for m in history_msgs]

    # Inject persistent memory context if enabled (PRD Section 11)
    settings = get_settings()
    if settings.auto_memory_enabled:
        mem_ctx = MemoryService.get_prompt_context(db, limit=settings.max_active_memories)
        if mem_ctx:
            chat_context.insert(0, ChatMessage(role="system", content=mem_ctx))

    # 3. Route through AI Router
    ai_router = get_ai_router()
    options = GenerateOptions(model=payload.model)
    stream_gen, model_tag = await ai_router.stream_with_fallback(
        chat_context,
        options=options,
        provider_name=payload.provider or conv.model,
    )

    chunks: list[str] = []
    async for chunk in stream_gen:
        chunks.append(chunk)
    full_response = "".join(chunks)

    # 4. Save assistant response
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=full_response,
        model=model_tag,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.post("/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Stream response tokens using Server-Sent Events (SSE).
    
    Persists user message immediately, streams tokens as they arrive,
    and commits the complete assistant message upon completion.
    """
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    conv = db.scalars(stmt).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )

    # 1. Save user message immediately
    user_msg_id = str(uuid.uuid4())
    user_msg = Message(
        id=user_msg_id,
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        model=None,
    )
    db.add(user_msg)
    db.commit()

    # 2. Collect conversation history
    history_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    history_msgs = list(db.scalars(history_stmt).all())
    chat_context = [ChatMessage(role=m.role, content=m.content) for m in history_msgs]

    # Inject persistent memory context if enabled (PRD Section 11)
    settings = get_settings()
    if settings.auto_memory_enabled:
        mem_ctx = MemoryService.get_prompt_context(db, limit=settings.max_active_memories)
        if mem_ctx:
            chat_context.insert(0, ChatMessage(role="system", content=mem_ctx))

    # 3. Get streaming generator from router
    ai_router = get_ai_router()
    options = GenerateOptions(model=payload.model)
    stream_gen, model_tag = await ai_router.stream_with_fallback(
        chat_context,
        options=options,
        provider_name=payload.provider or conv.model,
    )

    async def sse_event_generator() -> AsyncGenerator[str, None]:
        accumulated_text: list[str] = []
        assistant_msg_id = str(uuid.uuid4())

        # Send initial event with metadata
        yield f"data: {json.dumps({'event': 'start', 'model': model_tag, 'message_id': assistant_msg_id})}\n\n"

        try:
            async for token in stream_gen:
                accumulated_text.append(token)
                yield f"data: {json.dumps({'event': 'token', 'token': token})}\n\n"

            # Save the accumulated assistant message using the active db session
            asst_msg = Message(
                id=assistant_msg_id,
                conversation_id=conversation_id,
                role="assistant",
                content="".join(accumulated_text),
                model=model_tag,
            )
            db.add(asst_msg)
            db.commit()

            yield f"data: {json.dumps({'event': 'done', 'message_id': assistant_msg_id, 'model': model_tag})}\n\n"
        except Exception as exc:
            logger.error("SSE stream interrupted: %s", exc)
            yield f"data: {json.dumps({'event': 'error', 'error': str(exc)})}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
