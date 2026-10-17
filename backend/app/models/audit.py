"""Audit Log Model for Security and System Events.

Complies with SECURITY.md Section 2 (Auditability) and DATABASE.md.
Records important diagnostic, access, and lifecycle events without secrets.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    """Audit log entry for tracking system lifecycle and security operations."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    event_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    severity: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="INFO",
        index=True,
    )
    component: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, type={self.event_type}, severity={self.severity})>"
