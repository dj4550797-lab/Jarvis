"""Coding and Research Models.

Complies with Phase 7 requirements, PRD Section 17 & 18, and SECURITY.md:
- Code snapshot persistence for rollback and audit
- Research sessions with explicit fact vs uncertain claims distinction
- Genuine traceable source citation tracking
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CodeSnapshot(Base):
    """Snapshot of file content before a patch is applied, allowing reliable rollback."""

    __tablename__ = "code_snapshots"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        index=True,
    )
    original_content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    diff_patch: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Code modification",
    )
    restored: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )
    restored_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "file_path": self.file_path,
            "original_content": self.original_content,
            "diff_patch": self.diff_patch,
            "reason": self.reason,
            "restored": self.restored,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "restored_at": self.restored_at.isoformat() if self.restored_at else None,
        }


class ResearchSession(Base):
    """Research session organizing topics, findings, and citations."""

    __tablename__ = "research_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    topic: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="active",
        index=True,
    )
    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    sources: Mapped[list[ResearchSource]] = relationship(
        "ResearchSource",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ResearchSource.created_at.desc()",
    )

    def to_dict(self, include_sources: bool = True) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "topic": self.topic,
            "status": self.status,
            "summary": self.summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_sources:
            data["sources"] = [s.to_dict() for s in self.sources]
        return data


class ResearchSource(Base):
    """Documented evidence or citation within a research session."""

    __tablename__ = "research_sources"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("research_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    snippet: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    session: Mapped[ResearchSession] = relationship("ResearchSession", back_populates="sources")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "url": self.url,
            "title": self.title,
            "snippet": self.snippet,
            "is_verified": self.is_verified,
            "confidence": self.confidence,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
