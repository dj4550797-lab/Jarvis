"""Unit tests for Pydantic validation schemas."""

import pytest
from pydantic import ValidationError
from jarvis.schemas.tasks import CommandRequest
from jarvis.schemas.memories import MemoryCreate


def test_command_request_validation() -> None:
    """Verify CommandRequest validation bounds."""
    # Valid request
    req = CommandRequest(command="Open my local notes")
    assert req.command == "Open my local notes"
    assert req.device_id == "windows-desktop"
    assert req.allow_elevation is False

    # Empty command should fail validation
    with pytest.raises(ValidationError):
        CommandRequest(command="")


def test_memory_create_validation() -> None:
    """Verify MemoryCreate validation rules."""
    mem = MemoryCreate(
        content="User prefers dark theme",
        category="user",
        memory_type="preference",
    )
    assert mem.content == "User prefers dark theme"
    assert mem.importance == 1.0

    # Importance exceeding 1.0 should fail
    with pytest.raises(ValidationError):
        MemoryCreate(content="Test", importance=2.5)
