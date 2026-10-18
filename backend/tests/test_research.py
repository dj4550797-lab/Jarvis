"""Tests for Research Assistance Subsystem (Phase 7).

Complies with PRD Section 18, PLAN.md Section 11, and SECURITY.md:
- Research session lifecycle (create, read, update, delete)
- Traceable source and citation tracking
- Strict Honesty Rule: explicit segregation of verified facts from uncertain claims
- Formatted report exports in Markdown and JSON formats
- REST API endpoint integration
"""

from __future__ import annotations

import json
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.coding_research import ResearchSession, ResearchSource
from app.research.service import ResearchService


# --- Unit Tests: ResearchService ---

def test_research_service_create_and_get_session(db_session: Session) -> None:
    session = ResearchService.create_session(
        db=db_session,
        title="Python 3.12 GIL Improvements",
        topic="Python Concurrency",
        summary="Analysis of subinterpreters and per-interpreter GIL in Python 3.12.",
    )
    assert session.id is not None
    assert session.title == "Python 3.12 GIL Improvements"
    assert session.status == "active"

    retrieved = ResearchService.get_session(db=db_session, session_id=session.id)
    assert retrieved is not None
    assert retrieved.id == session.id
    assert retrieved.topic == "Python Concurrency"


def test_research_service_create_invalid() -> None:
    # Empty title
    with pytest.raises(ValueError, match="title cannot be empty"):
        ResearchService.create_session(db=None, title="", topic="Topic")  # type: ignore[arg-type]

    # Empty topic
    with pytest.raises(ValueError, match="topic cannot be empty"):
        ResearchService.create_session(db=None, title="Title", topic="  ")  # type: ignore[arg-type]


def test_research_service_update_session(db_session: Session) -> None:
    session = ResearchService.create_session(
        db=db_session,
        title="Initial Title",
        topic="Initial Topic",
    )
    updated = ResearchService.update_session(
        db=db_session,
        session_id=session.id,
        title="Updated Title",
        status="completed",
        summary="Completed research summary",
    )
    assert updated.title == "Updated Title"
    assert updated.status == "completed"
    assert updated.summary == "Completed research summary"


def test_research_service_delete_session(db_session: Session) -> None:
    session = ResearchService.create_session(db=db_session, title="Temp", topic="Temp")
    ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Temp Source",
        snippet="Sample snippet",
    )

    deleted = ResearchService.delete_session(db=db_session, session_id=session.id)
    assert deleted is True

    # Confirm session and cascaded sources are removed
    assert ResearchService.get_session(db=db_session, session_id=session.id) is None


def test_research_service_add_and_delete_source(db_session: Session) -> None:
    session = ResearchService.create_session(db=db_session, title="Web Assembly", topic="Compilers")

    # Add verified fact
    verified_src = ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Wasm 2.0 Spec",
        snippet="WebAssembly 2.0 adds multi-value returns and reference types.",
        url="https://webassembly.github.io/spec/core/",
        is_verified=True,
        confidence=1.0,
        notes="Official W3C specification document",
    )
    assert verified_src.id is not None
    assert verified_src.is_verified is True
    assert verified_src.confidence == 1.0

    # Add unverified claim (Strict Honesty Rule)
    unverified_src = ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Speculative Wasm Threading Benchmarks",
        snippet="Unverified forum claim stating 5x speedup across all browsers.",
        url=None,
        is_verified=False,
        confidence=0.45,
        notes="Requires independent benchmark reproduction.",
    )
    assert unverified_src.is_verified is False
    assert unverified_src.confidence == 0.45

    # Check session sources
    db_session.refresh(session)
    assert len(session.sources) == 2

    # Delete source
    deleted = ResearchService.delete_source(db=db_session, source_id=unverified_src.id)
    assert deleted is True
    db_session.refresh(session)
    assert len(session.sources) == 1
    assert session.sources[0].id == verified_src.id


def test_research_service_export_report_markdown(db_session: Session) -> None:
    session = ResearchService.create_session(
        db=db_session,
        title="Rust vs C++ Memory Safety",
        topic="Systems Programming",
        summary="Comparative study on compile-time borrow checking vs smart pointers.",
    )
    ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Rust Reference on Borrow Checker",
        snippet="Rust guarantees memory safety without garbage collection through its ownership model.",
        url="https://doc.rust-lang.org/reference/",
        is_verified=True,
        confidence=1.0,
        notes="Empirically verified by formal proofs.",
    )
    ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Unverified Developer Forum Claim",
        snippet="Rumor that compiler pass causes 50% compilation overhead in all cases.",
        url=None,
        is_verified=False,
        confidence=0.3,
        notes="No statistical sampling provided.",
    )

    report = ResearchService.export_report(db=db_session, session_id=session.id, export_format="markdown")
    content = report["content"]

    assert "# Research Report: Rust vs C++ Memory Safety" in content
    assert "## 1. Verified Facts & Empirical Evidence" in content
    assert "Rust Reference on Borrow Checker" in content
    assert "## 2. Hypotheses & Uncertain Claims" in content
    assert "Strict Honesty Rule" in content
    assert "Unverified Developer Forum Claim" in content
    assert "## 3. Citations & References" in content
    assert "https://doc.rust-lang.org/reference/" in content


def test_research_service_export_report_json(db_session: Session) -> None:
    session = ResearchService.create_session(
        db=db_session,
        title="JSON Export Test",
        topic="Testing",
    )
    ResearchService.add_source(
        db=db_session,
        session_id=session.id,
        title="Sample Fact",
        snippet="Valid snippet",
        is_verified=True,
    )

    report = ResearchService.export_report(db=db_session, session_id=session.id, export_format="json")
    assert report["format"] == "json"
    parsed = json.loads(report["content"])
    assert parsed["id"] == session.id
    assert parsed["title"] == "JSON Export Test"
    assert len(parsed["sources"]) == 1


# --- API Endpoint Integration Tests ---

def test_api_research_lifecycle(client: TestClient) -> None:
    # 1. Create session
    create_res = client.post(
        "/api/v1/research/sessions",
        json={
            "title": "Quantum Computing Status",
            "topic": "Quantum Information",
            "summary": "State of qubit coherence in 2026",
        },
    )
    assert create_res.status_code == 201
    session_data = create_res.json()
    session_id = session_data["id"]
    assert session_data["title"] == "Quantum Computing Status"

    # 2. List sessions
    list_res = client.get("/api/v1/research/sessions")
    assert list_res.status_code == 200
    sessions = list_res.json()
    assert any(s["id"] == session_id for s in sessions)

    # 3. Add source
    source_res = client.post(
        f"/api/v1/research/sessions/{session_id}/sources",
        json={
            "title": "Nature 2026 Qubit Survey",
            "snippet": "Coherence times reached 10ms in neutral atom systems.",
            "url": "https://nature.com/articles/sample",
            "is_verified": True,
            "confidence": 0.98,
            "notes": "Peer-reviewed experimental result.",
        },
    )
    assert source_res.status_code == 201
    source_data = source_res.json()
    source_id = source_data["id"]
    assert source_data["is_verified"] is True

    # 4. Get session with sources
    get_res = client.get(f"/api/v1/research/sessions/{session_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert len(detail["sources"]) == 1
    assert detail["sources"][0]["id"] == source_id

    # 5. Export Markdown
    export_res = client.post(
        f"/api/v1/research/sessions/{session_id}/export",
        json={"format": "markdown"},
    )
    assert export_res.status_code == 200
    report = export_res.json()
    assert report["format"] == "markdown"
    assert "Nature 2026 Qubit Survey" in report["content"]

    # 6. Delete source
    del_source_res = client.delete(f"/api/v1/research/sources/{source_id}")
    assert del_source_res.status_code == 200

    # 7. Delete session
    del_session_res = client.delete(f"/api/v1/research/sessions/{session_id}")
    assert del_session_res.status_code == 200

    # 8. Verify 404 after deletion
    get_after_del = client.get(f"/api/v1/research/sessions/{session_id}")
    assert get_after_del.status_code == 404
