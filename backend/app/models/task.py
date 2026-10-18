"""Background Task Model for Asynchronous Long-Running Jobs.

Complies with Phase 6 requirements, DATABASE.md, and SECURITY.md.
Tracks task status, progress, results, cancellation, and restart recovery safety.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    INTERRUPTED = "interrupted"


class BackgroundTask(Base):
    """Background task model representing asynchronous operations."""

    __tablename__ = "background_tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    task_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=TaskStatus.QUEUED.value,
        index=True,
    )
    progress: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    progress_message: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )
    params: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="{}",
    )
    result: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    timeout_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=300.0,
    )
    idempotent: Mapped[bool] = mapped_column(
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
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    def is_terminal(self) -> bool:
        """Return True if task has reached a final state."""
        return self.status in {
            TaskStatus.COMPLETED.value,
            TaskStatus.FAILED.value,
            TaskStatus.CANCELLED.value,
            TaskStatus.INTERRUPTED.value,
        }

    def get_params_dict(self) -> dict[str, Any]:
        """Deserialize params JSON safely."""
        try:
            return json.loads(self.params) if self.params else {}
        except Exception:
            return {}

    def get_result_dict(self) -> Any:
        """Deserialize result JSON safely."""
        if not self.result:
            return None
        try:
            return json.loads(self.result)
        except Exception:
            return self.result

    def to_dict(self) -> dict[str, Any]:
        """Serialize task to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "task_type": self.task_type,
            "status": self.status,
            "progress": round(self.progress, 1),
            "progress_message": self.progress_message,
            "params": self.get_params_dict(),
            "result": self.get_result_dict(),
            "error": self.error,
            "timeout_seconds": self.timeout_seconds,
            "idempotent": self.idempotent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
        }

    def __repr__(self) -> str:
        return f"<BackgroundTask(id={self.id}, name={self.name}, status={self.status}, progress={self.progress}%)>"
