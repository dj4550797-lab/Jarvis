"""Research Assistance API Endpoints.

Complies with Phase 7 requirements, PRD Section 18, and SECURITY.md:
- Research session lifecycle (create, update, delete, retrieve)
- Evidence capture with explicit fact vs hypothesis distinction (Strict Honesty Rule)
- Source attribution with verifiable URLs and confidence metrics
- Structured report exports (Markdown, JSON)
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.research.service import ResearchService
from app.utils.logging import logger

router = APIRouter(prefix="/research", tags=["research"])


class CreateSessionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255, description="Research session title")
    topic: str = Field(min_length=1, max_length=255, description="Research topic or domain")
    summary: str | None = Field(default=None, description="Executive summary or initial notes")


class UpdateSessionRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    topic: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, pattern="^(active|completed|archived)$")
    summary: str | None = Field(default=None)


class AddSourceRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255, description="Source or evidence title")
    snippet: str = Field(min_length=1, description="Direct quote, excerpt, or factual claim")
    url: str | None = Field(default=None, max_length=1024, description="Verifiable reference URL")
    is_verified: bool = Field(default=False, description="Strict Honesty: True if verified fact, False if hypothesis/uncertain")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence rating between 0.0 and 1.0")
    notes: str | None = Field(default=None, description="Analytical commentary, methodology, or caveats")


class ExportReportRequest(BaseModel):
    format: str = Field(default="markdown", pattern="^(markdown|json)$", description="Report format")


@router.get("/sessions")
def list_sessions(
    status_filter: str | None = Query(default=None, alias="status", description="Filter by status (active, completed, archived)"),
    limit: int = Query(default=50, ge=1, le=100, description="Max sessions to list"),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List research sessions with optional status filter."""
    sessions = ResearchService.list_sessions(db=db, status=status_filter, limit=limit)
    return [s.to_dict(include_sources=False) for s in sessions]


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Create a new research session."""
    try:
        session = ResearchService.create_session(
            db=db,
            title=payload.title,
            topic=payload.topic,
            summary=payload.summary,
        )
        return session.to_dict(include_sources=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to create research session: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve full details of a research session including all sources."""
    session = ResearchService.get_session(db=db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{session_id}' not found")
    return session.to_dict(include_sources=True)


@router.patch("/sessions/{session_id}")
def update_session(
    session_id: str,
    payload: UpdateSessionRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update research session title, topic, status, or summary."""
    try:
        session = ResearchService.update_session(
            db=db,
            session_id=session_id,
            title=payload.title,
            topic=payload.topic,
            status=payload.status,
            summary=payload.summary,
        )
        return session.to_dict(include_sources=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if "not found" in str(exc).lower() else status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to update session %s: %s", session_id, exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Delete a research session and all associated evidence sources."""
    deleted = ResearchService.delete_session(db=db, session_id=session_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{session_id}' not found")
    return {"status": "deleted", "id": session_id}


@router.post("/sessions/{session_id}/sources", status_code=status.HTTP_201_CREATED)
def add_source(
    session_id: str,
    payload: AddSourceRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Add a documented source or evidence item to a research session."""
    try:
        source = ResearchService.add_source(
            db=db,
            session_id=session_id,
            title=payload.title,
            snippet=payload.snippet,
            url=payload.url,
            is_verified=payload.is_verified,
            confidence=payload.confidence,
            notes=payload.notes,
        )
        return source.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if "not found" in str(exc).lower() else status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to add source to session %s: %s", session_id, exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete("/sources/{source_id}")
def delete_source(
    source_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Delete an evidence item by ID."""
    deleted = ResearchService.delete_source(db=db, source_id=source_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source '{source_id}' not found")
    return {"status": "deleted", "id": source_id}


@router.post("/sessions/{session_id}/export")
def export_report(
    session_id: str,
    payload: ExportReportRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Export research findings to formatted Markdown or JSON adhering to Strict Honesty Rule."""
    try:
        return ResearchService.export_report(
            db=db,
            session_id=session_id,
            export_format=payload.format,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to export research report for session %s: %s", session_id, exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
