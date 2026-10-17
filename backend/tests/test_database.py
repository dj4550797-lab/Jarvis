"""Unit and Integration Tests for Database Persistence and Session Handling.

Complies with DATABASE.md and TESTING.md Section 5.2.
"""

from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.conversation import Conversation, Message


def test_audit_log_persistence(db_session: Session) -> None:
    entry = AuditLog(
        id=str(uuid.uuid4()),
        event_type="SYSTEM_BOOT",
        severity="INFO",
        component="test_subsystem",
        message="System booted cleanly in test environment",
    )
    db_session.add(entry)
    db_session.commit()

    retrieved = db_session.scalar(select(AuditLog).where(AuditLog.id == entry.id))
    assert retrieved is not None
    assert retrieved.event_type == "SYSTEM_BOOT"
    assert retrieved.severity == "INFO"


def test_conversation_cascade_delete(db_session: Session) -> None:
    conv = Conversation(id=str(uuid.uuid4()), title="Test Cascade")
    db_session.add(conv)
    db_session.commit()

    msg1 = Message(id=str(uuid.uuid4()), conversation_id=conv.id, role="user", content="Hello")
    msg2 = Message(id=str(uuid.uuid4()), conversation_id=conv.id, role="assistant", content="Hi")
    db_session.add_all([msg1, msg2])
    db_session.commit()

    # Verify messages exist
    messages = list(db_session.scalars(select(Message).where(Message.conversation_id == conv.id)).all())
    assert len(messages) == 2

    # Delete conversation
    db_session.delete(conv)
    db_session.commit()

    # Verify messages were cascaded
    remaining = list(db_session.scalars(select(Message).where(Message.conversation_id == conv.id)).all())
    assert len(remaining) == 0
