"""Persistent Memory Database Model.

Complies with JARVIS_Master_PRD.md Section 11 and SECURITY.md Section 11:
- Distinguishes explicit facts from uncertain inferences
- UTC timestamps and UUID primary key
- Structured tagging and categorization
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Memory(Base):
    """A persistent memory record."""

    __tablename__ = "memories"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    memory_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="explicit_fact",
        index=True,
    )
    category: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    is_uncertain: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="user",
    )
    tags_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
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
        onupdate=utc_now,
        nullable=False,
    )

    @property
    def tags(self) -> list[str]:
        try:
            return json.loads(self.tags_json)
        except Exception:
            return []

    @tags.setter
    def tags(self, value: list[str]) -> None:
        self.tags_json = json.dumps(value)

    def __repr__(self) -> str:
        return f"<Memory(id={self.id}, type='{self.memory_type}', uncertain={self.is_uncertain})>"
