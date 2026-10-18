"""Notification Service and Dispatcher.

Complies with Phase 6 requirements, PRD Section 15, and SECURITY.md:
- Priority routing (low, normal, high, critical)
- DND and scheduled Quiet Hours (e.g., 22:00 - 08:00) with critical bypass
- Windows desktop toast notification delivery with safe non-blocking fallback
- Proactive event hooks for background task state transitions
- Complete persistence in SQLite with read/unread tracking
"""

from __future__ import annotations

import json
import os
import subprocess
import threading
from datetime import datetime, time, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_session_factory
from app.models.notification import (
    Notification,
    NotificationCategory,
    NotificationPreference,
    NotificationPriority,
)
from app.utils.logging import logger

PRIORITY_LEVELS = {
    NotificationPriority.LOW.value: 1,
    NotificationPriority.NORMAL.value: 2,
    NotificationPriority.HIGH.value: 3,
    NotificationPriority.CRITICAL.value: 4,
}


def parse_time_str(time_str: str) -> time:
    """Parse 'HH:MM' string to time object."""
    parts = time_str.strip().split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    return time(hour=hour, minute=minute)


def is_in_quiet_hours(start_str: str, end_str: str, current_time: time | None = None) -> bool:
    """Check if the given time falls within the quiet hours range."""
    if current_time is None:
        current_time = datetime.now().time()

    start = parse_time_str(start_str)
    end = parse_time_str(end_str)

    if start <= end:
        # Range does not cross midnight (e.g. 13:00 to 17:00)
        return start <= current_time <= end
    else:
        # Range crosses midnight (e.g. 22:00 to 08:00)
        return current_time >= start or current_time <= end


class NotificationService:
    """Central service for creating, delivering, and managing notifications."""

    _instance: NotificationService | None = None

    def __init__(self, session_factory: sessionmaker[Session] | None = None) -> None:
        self._session_factory = session_factory

    @classmethod
    def get_instance(cls) -> NotificationService:
        if cls._instance is None:
            cls._instance = NotificationService()
        return cls._instance

    def get_session_factory(self) -> sessionmaker[Session]:
        return self._session_factory or get_session_factory()

    def set_session_factory(self, factory: sessionmaker[Session] | None) -> None:
        self._session_factory = factory

    def get_or_create_preferences(self, db: Session) -> NotificationPreference:
        """Fetch singleton notification preferences or create default."""
        pref = db.execute(
            select(NotificationPreference).where(NotificationPreference.id == "default")
        ).scalar_one_or_none()

        if pref is None:
            pref = NotificationPreference(
                id="default",
                dnd_enabled=False,
                quiet_hours_enabled=False,
                quiet_hours_start="22:00",
                quiet_hours_end="08:00",
                min_priority_during_quiet=NotificationPriority.CRITICAL.value,
                desktop_notifications_enabled=True,
                sound_enabled=True,
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    def update_preferences(
        self,
        db: Session,
        dnd_enabled: bool | None = None,
        quiet_hours_enabled: bool | None = None,
        quiet_hours_start: str | None = None,
        quiet_hours_end: str | None = None,
        min_priority_during_quiet: str | None = None,
        desktop_notifications_enabled: bool | None = None,
        sound_enabled: bool | None = None,
    ) -> NotificationPreference:
        """Update notification preferences."""
        pref = self.get_or_create_preferences(db)

        if dnd_enabled is not None:
            pref.dnd_enabled = dnd_enabled
        if quiet_hours_enabled is not None:
            pref.quiet_hours_enabled = quiet_hours_enabled
        if quiet_hours_start is not None:
            # Validate HH:MM format
            parse_time_str(quiet_hours_start)
            pref.quiet_hours_start = quiet_hours_start
        if quiet_hours_end is not None:
            parse_time_str(quiet_hours_end)
            pref.quiet_hours_end = quiet_hours_end
        if min_priority_during_quiet is not None:
            if min_priority_during_quiet not in PRIORITY_LEVELS:
                raise ValueError(f"Invalid min_priority_during_quiet: {min_priority_during_quiet}")
            pref.min_priority_during_quiet = min_priority_during_quiet
        if desktop_notifications_enabled is not None:
            pref.desktop_notifications_enabled = desktop_notifications_enabled
        if sound_enabled is not None:
            pref.sound_enabled = sound_enabled

        pref.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(pref)
        return pref

    def should_suppress(
        self,
        priority: str,
        pref: NotificationPreference,
        current_time: time | None = None,
    ) -> bool:
        """Evaluate if notification should be suppressed by DND or Quiet Hours."""
        req_weight = PRIORITY_LEVELS.get(pref.min_priority_during_quiet, 4)
        p_weight = PRIORITY_LEVELS.get(priority, 2)

        # Critical priority bypass: if priority meets or exceeds min_priority_during_quiet, don't suppress
        if p_weight >= req_weight:
            return False

        # If DND is enabled, suppress lower priority
        if pref.dnd_enabled:
            return True

        # If Quiet Hours enabled and currently in quiet hours, suppress lower priority
        if pref.quiet_hours_enabled and is_in_quiet_hours(
            pref.quiet_hours_start, pref.quiet_hours_end, current_time
        ):
            return True

        return False

    def _deliver_desktop_toast(self, title: str, message: str) -> None:
        """Deliver a Windows desktop toast safely in a background daemon thread."""
        def run_toast() -> None:
            try:
                # Sanitized one-line strings for PowerShell toast
                safe_title = title.replace('"', '`"').replace("$", "`$")
                safe_msg = message.replace('"', '`"').replace("$", "`$")
                # Use Windows Notification via PowerShell script without popping window
                ps_script = (
                    f'[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms"); '
                    f'$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon; '
                    f'$objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information; '
                    f'$objNotifyIcon.BalloonTipIcon = "Info"; '
                    f'$objNotifyIcon.BalloonTipTitle = "{safe_title}"; '
                    f'$objNotifyIcon.BalloonTipText = "{safe_msg}"; '
                    f'$objNotifyIcon.Visible = $True; '
                    f'$objNotifyIcon.ShowBalloonTip(5000); '
                    f'Start-Sleep -Seconds 1; '
                    f'$objNotifyIcon.Dispose()'
                )
                subprocess.run(
                    ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                    capture_output=True,
                    timeout=8,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
            except Exception as e:
                logger.debug("Desktop toast delivery skipped or failed: %s", e)

        thread = threading.Thread(target=run_toast, daemon=True)
        thread.start()

    def post_notification(
        self,
        title: str,
        message: str,
        priority: str = NotificationPriority.NORMAL.value,
        category: str = NotificationCategory.GENERAL.value,
        metadata: dict[str, Any] | None = None,
        db: Session | None = None,
        deliver_desktop: bool = True,
    ) -> Notification:
        """Create and persist a notification, applying DND/Quiet Hours rules."""
        if priority not in PRIORITY_LEVELS:
            priority = NotificationPriority.NORMAL.value

        should_close = False
        if db is None:
            factory = self.get_session_factory()
            db = factory()
            should_close = True

        try:
            pref = self.get_or_create_preferences(db)
            suppressed = self.should_suppress(priority, pref)

            # Desktop delivery permitted if not suppressed and preferences allow
            can_deliver_desktop = (
                deliver_desktop
                and not suppressed
                and pref.desktop_notifications_enabled
                and os.name == "nt"
            )

            delivered = False
            if can_deliver_desktop:
                self._deliver_desktop_toast(title, message)
                delivered = True

            notification = Notification(
                title=title,
                message=message,
                priority=priority,
                category=category,
                read=False,
                delivered=delivered,
                suppressed_by_dnd=suppressed,
                metadata_json=json.dumps(metadata) if metadata else None,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            logger.info(
                "Notification posted: [%s] '%s' (suppressed=%s, delivered=%s)",
                priority,
                title,
                suppressed,
                delivered,
            )
            return notification
        finally:
            if should_close:
                db.close()

    def list_notifications(
        self,
        db: Session,
        unread_only: bool = False,
        category: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        """List notifications with filtering."""
        query = select(Notification).order_by(Notification.created_at.desc())
        if unread_only:
            query = query.where(Notification.read == False)  # noqa: E712
        if category:
            query = query.where(Notification.category == category)
        query = query.limit(limit).offset(offset)
        return list(db.execute(query).scalars().all())

    def get_unread_count(self, db: Session) -> int:
        """Get count of unread notifications."""
        query = select(func.count(Notification.id)).where(Notification.read == False)  # noqa: E712
        return db.execute(query).scalar() or 0

    def mark_as_read(self, db: Session, notification_id: str) -> Notification | None:
        """Mark a notification as read."""
        notif = db.execute(
            select(Notification).where(Notification.id == notification_id)
        ).scalar_one_or_none()
        if notif:
            notif.read = True
            notif.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)
        return notif

    def mark_all_as_read(self, db: Session) -> int:
        """Mark all unread notifications as read."""
        notifs = db.execute(
            select(Notification).where(Notification.read == False)  # noqa: E712
        ).scalars().all()
        now = datetime.now(timezone.utc)
        count = 0
        for notif in notifs:
            notif.read = True
            notif.read_at = now
            count += 1
        db.commit()
        return count

    def delete_notification(self, db: Session, notification_id: str) -> bool:
        """Delete a notification record."""
        notif = db.execute(
            select(Notification).where(Notification.id == notification_id)
        ).scalar_one_or_none()
        if notif:
            db.delete(notif)
            db.commit()
            return True
        return False


def get_notification_service() -> NotificationService:
    return NotificationService.get_instance()
