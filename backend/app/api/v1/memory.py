"""Persistent Memory REST API Endpoints.

Implements PRD Section 11 & SECURITY.md Section 11:
- Memory creation, retrieval, search, update, deletion
- Explicit clear confirmation flow
- Full backup export
- Input validation and credential exposure prevention
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.memory.security import CredentialExposureError
from app.memory.service import MemoryService

router = APIRouter(prefix="/memories", tags=["memories"])


class MemoryCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    memory_type: str = Field(default="explicit_fact")
    category: str | None = Field(default=None, max_length=50)
    is_uncertain: bool = Field(default=False)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source: str = Field(default="user", max_length=100)
    tags: list[str] = Field(default_factory=list)


class MemoryUpdateRequest(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=5000)
    memory_type: str | None = None
    category: str | None = None
    is_uncertain: bool | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    tags: list[str] | None = None


class MemoryResponse(BaseModel):
    id: str
    content: str
    memory_type: str
    category: str | None
    is_uncertain: bool
    confidence: float
    source: str
    tags: list[str]
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True


class MemoryListResponse(BaseModel):
    total: int
    items: list[MemoryResponse]


class ClearMemoryRequest(BaseModel):
    confirm: bool = Field(description="Must be explicitly True to clear all memories")


@router.get("", response_model=MemoryListResponse)
def list_memories(
    query: str | None = Query(None, description="Search term matching content or tags"),
    memory_type: str | None = Query(None, description="Filter by memory type"),
    category: str | None = Query(None, description="Filter by category"),
    is_uncertain: bool | None = Query(None, description="Filter by uncertainty status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> MemoryListResponse:
    """List and search persistent memories with pagination."""
    items, total = MemoryService.list_memories(
        db,
        query=query,
        memory_type=memory_type,
        category=category,
        is_uncertain=is_uncertain,
        limit=limit,
        offset=offset,
    )
    return MemoryListResponse(
        total=total,
        items=[
            MemoryResponse(
                id=m.id,
                content=m.content,
                memory_type=m.memory_type,
                category=m.category,
                is_uncertain=m.is_uncertain,
                confidence=m.confidence,
                source=m.source,
                tags=m.tags,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
            for m in items
        ],
    )


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    payload: MemoryCreateRequest,
    db: Session = Depends(get_db),
) -> MemoryResponse:
    """Create a new persistent memory item with credential safety checks."""
    try:
        mem = MemoryService.create_memory(
            db,
            content=payload.content,
            memory_type=payload.memory_type,
            category=payload.category,
            is_uncertain=payload.is_uncertain,
            confidence=payload.confidence,
            source=payload.source,
            tags=payload.tags,
        )
        return MemoryResponse(
            id=mem.id,
            content=mem.content,
            memory_type=mem.memory_type,
            category=mem.category,
            is_uncertain=mem.is_uncertain,
            confidence=mem.confidence,
            source=mem.source,
            tags=mem.tags,
            created_at=mem.created_at,
            updated_at=mem.updated_at,
        )
    except CredentialExposureError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get("/export", response_model=dict[str, Any])
def export_memories(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Export all stored memories for transparency and local backup."""
    return MemoryService.export_memories(db)


@router.post("/clear", response_model=dict[str, Any])
def clear_memories(
    payload: ClearMemoryRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Clear all stored memories after explicit confirmation."""
    if not payload.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Memory clearance aborted. 'confirm' must be explicitly set to True.",
        )
    count = MemoryService.clear_all_memories(db)
    return {
        "status": "success",
        "message": f"Successfully cleared {count} memory records.",
        "deleted_count": count,
    }


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(
    memory_id: str,
    db: Session = Depends(get_db),
) -> MemoryResponse:
    """Get a specific memory item by ID."""
    mem = MemoryService.get_memory(db, memory_id)
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory '{memory_id}' not found",
        )
    return MemoryResponse(
        id=mem.id,
        content=mem.content,
        memory_type=mem.memory_type,
        category=mem.category,
        is_uncertain=mem.is_uncertain,
        confidence=mem.confidence,
        source=mem.source,
        tags=mem.tags,
        created_at=mem.created_at,
        updated_at=mem.updated_at,
    )


@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: str,
    payload: MemoryUpdateRequest,
    db: Session = Depends(get_db),
) -> MemoryResponse:
    """Update an existing memory item."""
    try:
        mem = MemoryService.update_memory(
            db,
            memory_id=memory_id,
            content=payload.content,
            memory_type=payload.memory_type,
            category=payload.category,
            is_uncertain=payload.is_uncertain,
            confidence=payload.confidence,
            tags=payload.tags,
        )
        if not mem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Memory '{memory_id}' not found",
            )
        return MemoryResponse(
            id=mem.id,
            content=mem.content,
            memory_type=mem.memory_type,
            category=mem.category,
            is_uncertain=mem.is_uncertain,
            confidence=mem.confidence,
            source=mem.source,
            tags=mem.tags,
            created_at=mem.created_at,
            updated_at=mem.updated_at,
        )
    except CredentialExposureError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Delete an individual memory item."""
    deleted = MemoryService.delete_memory(db, memory_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory '{memory_id}' not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
