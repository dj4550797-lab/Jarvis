"""Tests for Notifications and Preferences (Phase 6).

Complies with PRD Section 15, PHASE_6_SPEC.md, and TESTING.md.
"""

from __future__ import annotations

from collections.abc import Generator
from datetime import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.models.notification import Notification, NotificationPriority
from app.notifications.service import get_notification_service, is_in_quiet_hours


@pytest.fixture(autouse=True)
def bind_test_session_factory(db_session: Session) -> Generator[None, None, None]:
    service = get_notification_service()
    bind = db_session.get_bind()
    factory = sessionmaker(autocommit=False, autoflush=False, bind=bind, expire_on_commit=False)
    service.set_session_factory(factory)
    yield
    service.set_session_factory(None)



def test_quiet_hours_time_evaluator() -> None:
    # Overnight range: 22:00 to 08:00
    assert is_in_quiet_hours("22:00", "08:00", current_time=time(23, 30)) is True
    assert is_in_quiet_hours("22:00", "08:00", current_time=time(2, 15)) is True
    assert is_in_quiet_hours("22:00", "08:00", current_time=time(8, 0)) is True
    assert is_in_quiet_hours("22:00", "08:00", current_time=time(8, 1)) is False
    assert is_in_quiet_hours("22:00", "08:00", current_time=time(14, 0)) is False

    # Daytime range: 13:00 to 15:00
    assert is_in_quiet_hours("13:00", "15:00", current_time=time(14, 0)) is True
    assert is_in_quiet_hours("13:00", "15:00", current_time=time(12, 59)) is False


def test_dnd_and_critical_bypass(db_session: Session) -> None:
    service = get_notification_service()

    # Enable DND
    service.update_preferences(db=db_session, dnd_enabled=True)

    # Normal notification should be suppressed by DND
    n1 = service.post_notification(
        title="Normal Alert",
        message="This is a routine update",
        priority=NotificationPriority.NORMAL.value,
        db=db_session,
        deliver_desktop=False,
    )
    assert n1.suppressed_by_dnd is True

    # Critical notification should bypass DND
    n2 = service.post_notification(
        title="Security Alert",
        message="Critical security event",
        priority=NotificationPriority.CRITICAL.value,
        db=db_session,
        deliver_desktop=False,
    )
    assert n2.suppressed_by_dnd is False


def test_notification_read_and_delete_lifecycle(db_session: Session) -> None:
    service = get_notification_service()

    # Post notifications
    n1 = service.post_notification(title="Alert 1", message="Message 1", db=db_session, deliver_desktop=False)
    n2 = service.post_notification(title="Alert 2", message="Message 2", db=db_session, deliver_desktop=False)

    assert service.get_unread_count(db_session) >= 2

    # Mark single as read
    marked = service.mark_as_read(db_session, n1.id)
    assert marked is not None
    assert marked.read is True
    assert marked.read_at is not None

    # Mark all read
    count = service.mark_all_as_read(db_session)
    assert count >= 1
    assert service.get_unread_count(db_session) == 0

    # Delete
    deleted = service.delete_notification(db_session, n1.id)
    assert deleted is True
    assert db_session.query(Notification).filter_by(id=n1.id).first() is None


def test_notifications_api(client: TestClient) -> None:
    # 1. Post notification
    resp_create = client.post(
        "/api/v1/notifications",
        json={
            "title": "API Test Alert",
            "message": "Testing notification delivery via API",
            "priority": "high",
            "category": "task",
            "deliver_desktop": False,
        },
    )
    assert resp_create.status_code == 201
    data = resp_create.json()
    assert data["title"] == "API Test Alert"
    assert data["priority"] == "high"
    notif_id = data["id"]

    # 2. Get unread count
    resp_count = client.get("/api/v1/notifications/unread-count")
    assert resp_count.status_code == 200
    assert resp_count.json()["unread_count"] >= 1

    # 3. List notifications
    resp_list = client.get("/api/v1/notifications")
    assert resp_list.status_code == 200
    assert any(n["id"] == notif_id for n in resp_list.json())

    # 4. Mark read
    resp_read = client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert resp_read.status_code == 200
    assert resp_read.json()["read"] is True

    # 5. Mark all read
    resp_mark_all = client.post("/api/v1/notifications/mark-all-read")
    assert resp_mark_all.status_code == 200

    # 6. Delete notification
    resp_del = client.delete(f"/api/v1/notifications/{notif_id}")
    assert resp_del.status_code == 200

    # 7. Check preferences GET and PUT
    resp_pref = client.get("/api/v1/notifications/preferences")
    assert resp_pref.status_code == 200
    pref_data = resp_pref.json()
    assert "dnd_enabled" in pref_data

    resp_pref_update = client.put(
        "/api/v1/notifications/preferences",
        json={
            "dnd_enabled": True,
            "quiet_hours_enabled": True,
            "quiet_hours_start": "23:00",
            "quiet_hours_end": "07:00",
        },
    )
    assert resp_pref_update.status_code == 200
    updated = resp_pref_update.json()
    assert updated["dnd_enabled"] is True
    assert updated["quiet_hours_start"] == "23:00"
