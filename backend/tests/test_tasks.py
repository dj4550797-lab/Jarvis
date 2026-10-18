"""Tests for Background Task Manager and Async Execution (Phase 6).

Complies with PRD Section 15, PHASE_6_SPEC.md, and TESTING.md.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from collections.abc import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.models.task import BackgroundTask, TaskStatus
from app.tasks.manager import get_task_manager
from app.tools.emergency import get_emergency_manager


@pytest.fixture(autouse=True)
def bind_test_session_factory(db_session: Session) -> Generator[None, None, None]:
    mgr = get_task_manager()
    bind = db_session.get_bind()
    factory = sessionmaker(autocommit=False, autoflush=False, bind=bind, expire_on_commit=False)
    mgr.set_session_factory(factory)
    yield
    mgr.set_session_factory(None)


def test_task_manager_registration() -> None:
    mgr = get_task_manager()
    assert "file_search" in mgr._handlers
    assert "system_diagnostic" in mgr._handlers
    assert "simulation" in mgr._handlers


@pytest.mark.asyncio
async def test_enqueue_and_execute_simulation_task(db_session: Session) -> None:
    mgr = get_task_manager()
    task = await mgr.enqueue_task(
        name="Test Simulation Job",
        task_type="simulation",
        params={"steps": 3, "step_delay": 0.05},
        db=db_session,
    )
    assert task.id is not None
    assert task.status == TaskStatus.QUEUED.value

    # Wait for background task to complete
    for _ in range(30):
        await asyncio.sleep(0.05)
        db_session.expire_all()
        current = db_session.query(BackgroundTask).filter_by(id=task.id).first()
        if current and current.status == TaskStatus.COMPLETED.value:
            break

    current = db_session.query(BackgroundTask).filter_by(id=task.id).first()
    assert current is not None
    assert current.status == TaskStatus.COMPLETED.value
    assert current.progress == 100.0
    res = current.get_result_dict()
    assert res is not None
    assert res.get("status") == "simulation_complete"
    assert res.get("total_steps") == 3


@pytest.mark.asyncio
async def test_task_cancellation(db_session: Session) -> None:
    mgr = get_task_manager()
    task = await mgr.enqueue_task(
        name="Long Cancellable Job",
        task_type="simulation",
        params={"steps": 20, "step_delay": 0.2},
        db=db_session,
    )

    await asyncio.sleep(0.05)
    cancelled = await mgr.cancel_task(task.id)
    assert cancelled is True

    await asyncio.sleep(0.05)
    db_session.expire_all()
    current = db_session.query(BackgroundTask).filter_by(id=task.id).first()
    assert current is not None
    assert current.status == TaskStatus.CANCELLED.value
    assert current.cancelled_at is not None


@pytest.mark.asyncio
async def test_task_timeout(db_session: Session) -> None:
    mgr = get_task_manager()
    task = await mgr.enqueue_task(
        name="Timeout Job",
        task_type="simulation",
        params={"steps": 10, "step_delay": 0.2},
        timeout_seconds=0.15,
        db=db_session,
    )

    for _ in range(25):
        await asyncio.sleep(0.05)
        db_session.expire_all()
        current = db_session.query(BackgroundTask).filter_by(id=task.id).first()
        if current and current.is_terminal():
            break

    current = db_session.query(BackgroundTask).filter_by(id=task.id).first()
    assert current is not None
    assert current.status == TaskStatus.FAILED.value
    assert "timeout" in (current.error or "").lower()


def test_task_recovery_safely_marks_interrupted(db_session: Session) -> None:
    # Seed orphaned running and queued tasks
    t1 = BackgroundTask(
        name="Orphaned Running Task",
        task_type="file_search",
        status=TaskStatus.RUNNING.value,
        progress=45.0,
        idempotent=False,
        created_at=datetime.now(timezone.utc),
    )
    t2 = BackgroundTask(
        name="Orphaned Queued Task",
        task_type="simulation",
        status=TaskStatus.QUEUED.value,
        progress=0.0,
        idempotent=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add_all([t1, t2])
    db_session.commit()

    mgr = get_task_manager()
    interrupted_ids = mgr.recover_interrupted_tasks(db=db_session)

    assert t1.id in interrupted_ids
    assert t2.id in interrupted_ids

    db_session.expire_all()
    r1 = db_session.query(BackgroundTask).filter_by(id=t1.id).first()
    r2 = db_session.query(BackgroundTask).filter_by(id=t2.id).first()
    assert r1 is not None and r1.status == TaskStatus.INTERRUPTED.value
    assert r2 is not None and r2.status == TaskStatus.INTERRUPTED.value
    assert "restarted" in (r1.error or "").lower()


def test_tasks_api_endpoints(client: TestClient) -> None:
    # 1. Enqueue task via API
    resp = client.post(
        "/api/v1/tasks",
        json={
            "name": "API Diagnostic Test",
            "task_type": "simulation",
            "params": {"steps": 2, "step_delay": 0.05},
            "timeout_seconds": 60.0,
        },
    )
    assert resp.status_code == 201
    task_data = resp.json()
    assert task_data["name"] == "API Diagnostic Test"
    assert task_data["status"] in {"queued", "running", "completed"}
    task_id = task_data["id"]

    # 2. Get task details
    resp_get = client.get(f"/api/v1/tasks/{task_id}")
    assert resp_get.status_code == 200
    assert resp_get.json()["id"] == task_id

    # 3. List tasks
    resp_list = client.get("/api/v1/tasks")
    assert resp_list.status_code == 200
    assert any(t["id"] == task_id for t in resp_list.json())

    # 4. Cancel endpoint
    resp_cancel = client.post(f"/api/v1/tasks/{task_id}/cancel")
    assert resp_cancel.status_code == 200

    # 5. Recovery endpoint
    resp_rec = client.post("/api/v1/tasks/recover")
    assert resp_rec.status_code == 200
    assert "interrupted_task_count" in resp_rec.json()


def test_emergency_stop_blocks_task_enqueue(client: TestClient) -> None:
    emergency = get_emergency_manager()
    emergency.engage(reason="Safety test engagement")

    try:
        resp = client.post(
            "/api/v1/tasks",
            json={
                "name": "Should Block",
                "task_type": "simulation",
                "params": {},
            },
        )
        assert resp.status_code == 409
        assert "emergency stop is engaged" in resp.json()["detail"].lower()
    finally:
        emergency.reset(confirmed=True)
