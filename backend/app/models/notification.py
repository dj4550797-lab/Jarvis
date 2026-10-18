"""Notification and Preferences Models.

Complies with Phase 6 requirements, DATABASE.md, and SECURITY.md.
Provides support for notification priorities, delivery status, quiet hours, and DND.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationCategory(str, Enum):
    TASK = "task"
    SYSTEM = "system"
    SECURITY = "security"
    REMINDER = "reminder"
    GENERAL = "general"


class Notification(Base):
    """Notification record persisted for user review and history."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=NotificationPriority.NORMAL.value,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=NotificationCategory.GENERAL.value,
        index=True,
    )
    read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    delivered: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    suppressed_by_dnd: Mapped[bool] = mapped_column(
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
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    metadata_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    def get_metadata(self) -> dict[str, Any]:
        """Safely deserialize metadata JSON."""
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    def to_dict(self) -> dict[str, Any]:
        """Serialize notification to dict."""
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "priority": self.priority,
            "category": self.category,
            "read": self.read,
            "delivered": self.delivered,
            "suppressed_by_dnd": self.suppressed_by_dnd,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "metadata": self.get_metadata(),
        }

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, title={self.title}, priority={self.priority}, read={self.read})>"


class NotificationPreference(Base):
    """User preferences for notifications, quiet hours, and DND scheduling."""

    __tablename__ = "notification_preferences"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default="default",
    )
    dnd_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    quiet_hours_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    quiet_hours_start: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="22:00",
    )
    quiet_hours_end: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="08:00",
    )
    min_priority_during_quiet: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=NotificationPriority.CRITICAL.value,
    )
    desktop_notifications_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    sound_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "dnd_enabled": self.dnd_enabled,
            "quiet_hours_enabled": self.quiet_hours_enabled,
            "quiet_hours_start": self.quiet_hours_start,
            "quiet_hours_end": self.quiet_hours_end,
            "min_priority_during_quiet": self.min_priority_during_quiet,
            "desktop_notifications_enabled": self.desktop_notifications_enabled,
            "sound_enabled": self.sound_enabled,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
