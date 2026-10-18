"""Background Tasks API Endpoints.

Complies with Phase 6 requirements, PRD Section 15, and SECURITY.md:
- Task listing and detail retrieval
- Enqueuing background jobs
- Immediate cancellation
- Interrupted task recovery
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import BackgroundTask, TaskStatus
from app.tasks.manager import get_task_manager
from app.tools.emergency import get_emergency_manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskEnqueueRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="Human-readable task name")
    task_type: str = Field(description="Type of task: file_search, system_diagnostic, simulation")
    params: dict[str, Any] = Field(default_factory=dict, description="Job parameters")
    timeout_seconds: float = Field(default=300.0, ge=1.0, le=3600.0, description="Execution timeout")
    idempotent: bool = Field(default=False, description="Whether the task can be safely repeated")


@router.get("")
def list_tasks(
    status_filter: str | None = Query(default=None, alias="status", description="Filter by status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List background tasks ordered by most recent first."""
    query = select(BackgroundTask).order_by(BackgroundTask.created_at.desc())
    if status_filter:
        query = query.where(BackgroundTask.status == status_filter)
    query = query.limit(limit).offset(offset)
    tasks = db.execute(query).scalars().all()
    return [task.to_dict() for task in tasks]


@router.post("", status_code=status.HTTP_201_CREATED)
async def enqueue_task(
    payload: TaskEnqueueRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Enqueue a new background task."""
    emergency = get_emergency_manager()
    if emergency.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Emergency stop is engaged: {emergency.get_status().get('reason') or 'Operations halted'}",
        )

    mgr = get_task_manager()
    try:
        task = await mgr.enqueue_task(
            name=payload.name,
            task_type=payload.task_type,
            params=payload.params,
            timeout_seconds=payload.timeout_seconds,
            idempotent=payload.idempotent,
            db=db,
        )
        return task.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("/{task_id}")
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve details, status, and progress for a single task."""
    task = db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task '{task_id}' not found")
    return task.to_dict()


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Cancel a running or queued background task."""
    task = db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task '{task_id}' not found")

    if task.is_terminal():
        return {
            "status": task.status,
            "task_id": task.id,
            "message": f"Task already reached terminal state '{task.status}'",
            "cancelled": False,
        }

    mgr = get_task_manager()
    success = await mgr.cancel_task(task_id)
    return {
        "status": TaskStatus.CANCELLED.value,
        "task_id": task_id,
        "cancelled": success,
        "message": "Task cancellation requested",
    }


@router.post("/recover")
def recover_interrupted_tasks() -> dict[str, Any]:
    """Inspect and mark any orphaned in-flight tasks as interrupted."""
    mgr = get_task_manager()
    interrupted = mgr.recover_interrupted_tasks()
    return {
        "status": "success",
        "interrupted_task_count": len(interrupted),
        "interrupted_task_ids": interrupted,
    }
