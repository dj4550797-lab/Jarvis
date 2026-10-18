"""Notifications and Preferences API Endpoints.

Complies with Phase 6 requirements, PRD Section 15, and SECURITY.md:
- Notification listing and unread count
- Read/unread state transitions
- Notification creation and delivery
- DND and Quiet Hours preferences management
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.notifications.service import get_notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)
    priority: str = Field(default="normal", description="low, normal, high, critical")
    category: str = Field(default="general", description="task, system, security, reminder, general")
    metadata: dict[str, Any] | None = Field(default=None)
    deliver_desktop: bool = Field(default=True)


class PreferencesUpdateRequest(BaseModel):
    dnd_enabled: bool | None = None
    quiet_hours_enabled: bool | None = None
    quiet_hours_start: str | None = Field(default=None, pattern=r"^\d{1,2}:\d{2}$")
    quiet_hours_end: str | None = Field(default=None, pattern=r"^\d{1,2}:\d{2}$")
    min_priority_during_quiet: str | None = Field(default=None, pattern=r"^(low|normal|high|critical)$")
    desktop_notifications_enabled: bool | None = None
    sound_enabled: bool | None = None


@router.get("")
def list_notifications(
    unread_only: bool = Query(default=False),
    category: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List notifications with optional filters."""
    service = get_notification_service()
    items = service.list_notifications(
        db=db,
        unread_only=unread_only,
        category=category,
        limit=limit,
        offset=offset,
    )
    return [item.to_dict() for item in items]


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db)) -> dict[str, int]:
    """Retrieve count of unread notifications."""
    service = get_notification_service()
    return {"unread_count": service.get_unread_count(db)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreateRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Manually post a notification."""
    service = get_notification_service()
    notif = service.post_notification(
        title=payload.title,
        message=payload.message,
        priority=payload.priority,
        category=payload.category,
        metadata=payload.metadata,
        db=db,
        deliver_desktop=payload.deliver_desktop,
    )
    return notif.to_dict()


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Mark an individual notification as read."""
    service = get_notification_service()
    notif = service.mark_as_read(db, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif.to_dict()


@router.post("/mark-all-read")
def mark_all_notifications_read(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Mark all unread notifications as read."""
    service = get_notification_service()
    count = service.mark_all_as_read(db)
    return {"status": "success", "marked_read_count": count}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Delete a notification by ID."""
    service = get_notification_service()
    success = service.delete_notification(db, notification_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "deleted", "id": notification_id}


@router.get("/preferences")
def get_preferences(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get current DND and Quiet Hours preferences."""
    service = get_notification_service()
    pref = service.get_or_create_preferences(db)
    return pref.to_dict()


@router.put("/preferences")
def update_preferences(
    payload: PreferencesUpdateRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update DND and Quiet Hours preferences."""
    service = get_notification_service()
    try:
        pref = service.update_preferences(
            db=db,
            dnd_enabled=payload.dnd_enabled,
            quiet_hours_enabled=payload.quiet_hours_enabled,
            quiet_hours_start=payload.quiet_hours_start,
            quiet_hours_end=payload.quiet_hours_end,
            min_priority_during_quiet=payload.min_priority_during_quiet,
            desktop_notifications_enabled=payload.desktop_notifications_enabled,
            sound_enabled=payload.sound_enabled,
        )
        return pref.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
