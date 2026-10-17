"""Tests for MemoryService Persistence, Uncertainty, and Prompt Context.

Complies with PRD Section 11 and TESTING.md Section 7.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.memory.service import MemoryService
from app.models.memory import Memory


def test_memory_creation_and_retrieval(db_session: Session) -> None:
    mem = MemoryService.create_memory(
        db_session,
        content="User's primary operating system is Windows 10.",
        memory_type="explicit_fact",
        category="system",
        tags=["windows", "os"],
    )
    assert mem.id is not None
    assert mem.content == "User's primary operating system is Windows 10."
    assert mem.memory_type == "explicit_fact"
    assert mem.is_uncertain is False
    assert mem.confidence == 1.0
    assert "windows" in mem.tags

    fetched = MemoryService.get_memory(db_session, mem.id)
    assert fetched is not None
    assert fetched.content == mem.content


def test_inferred_memory_uncertainty_handling(db_session: Session) -> None:
    mem = MemoryService.create_memory(
        db_session,
        content="User may prefer working in the evening.",
        memory_type="inferred",
        category="habits",
        is_uncertain=True,
        confidence=0.65,
    )
    assert mem.is_uncertain is True
    assert mem.confidence == 0.65

    context = MemoryService.get_prompt_context(db_session)
    assert "Uncertain Inferences" in context
    assert "65% confidence" in context
    assert "User may prefer working in the evening." in context


def test_memory_search_and_filtering(db_session: Session) -> None:
    MemoryService.create_memory(db_session, content="React 18 frontend framework", memory_type="project_context")
    MemoryService.create_memory(db_session, content="FastAPI Python backend", memory_type="project_context")
    MemoryService.create_memory(db_session, content="Prefers dark theme", memory_type="preference")

    # Search query
    react_results, total = MemoryService.list_memories(db_session, query="React")
    assert total == 1
    assert "React" in react_results[0].content

    # Filter by type
    pref_results, pref_total = MemoryService.list_memories(db_session, memory_type="preference")
    assert pref_total == 1
    assert pref_results[0].content == "Prefers dark theme"


def test_memory_update_and_delete(db_session: Session) -> None:
    mem = MemoryService.create_memory(db_session, content="Temporary note", memory_type="reminder")
    
    updated = MemoryService.update_memory(db_session, mem.id, content="Updated permanent fact", memory_type="explicit_fact")
    assert updated is not None
    assert updated.content == "Updated permanent fact"
    assert updated.memory_type == "explicit_fact"

    deleted = MemoryService.delete_memory(db_session, mem.id)
    assert deleted is True

    # Confirm it cannot be retrieved
    assert MemoryService.get_memory(db_session, mem.id) is None


def test_clear_all_memories_and_export(db_session: Session) -> None:
    MemoryService.create_memory(db_session, content="Fact 1", memory_type="explicit_fact")
    MemoryService.create_memory(db_session, content="Fact 2", memory_type="explicit_fact")

    export_data = MemoryService.export_memories(db_session)
    assert export_data["total_records"] == 2
    assert len(export_data["memories"]) == 2

    cleared_count = MemoryService.clear_all_memories(db_session)
    assert cleared_count == 2

    post_clear = MemoryService.export_memories(db_session)
    assert post_clear["total_records"] == 0
