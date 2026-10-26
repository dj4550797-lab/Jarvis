"""Tasks and Autonomous Command Execution Router."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from jarvis.core.events import event_bus
from jarvis.core.logging import logger
from jarvis.database.connection import get_db_connection
from jarvis.schemas.tasks import (
    CommandRequest,
    TaskListResponse,
    TaskResponse,
    TaskStatus,
)

router = APIRouter(prefix="/tasks", tags=["Tasks & Commands"])


@router.post("/execute", response_model=TaskResponse, status_code=202)
async def execute_command(req: CommandRequest) -> TaskResponse:
    """Submit a natural language command for planning and execution."""
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Rule-based initial risk assessment
    cmd_lower = req.command.lower()
    is_high_risk = any(kw in cmd_lower for kw in ["delete", "remove", "format", "shred", "drop", "shutdown"])
    risk_level = "High" if is_high_risk else "Low"
    requires_approval = is_high_risk and not req.allow_elevation
    initial_status: TaskStatus = "AwaitingApproval" if requires_approval else "Queued"

    # Truncate command for title
    title = req.command[:80] + ("..." if len(req.command) > 80 else "")

    async with get_db_connection() as conn:
        await conn.execute(
            """
            INSERT INTO tasks (
                id, title, command_raw, status, risk_level,
                requires_approval, progress_pct, device_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task_id,
                title,
                req.command,
                initial_status,
                risk_level,
                1 if requires_approval else 0,
                0.0,
                req.device_id,
                now.isoformat(),
                now.isoformat(),
            ),
        )

        # Record audit log entry
        await conn.execute(
            """
            INSERT INTO audit_logs (event_type, actor, action_details, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                "command_submit",
                "user",
                f'{{"task_id": "{task_id}", "title": "{title}"}}',
                risk_level,
                now.isoformat(),
            ),
        )

        await conn.commit()

    logger.info("Task created: ID=%s Status=%s Risk=%s", task_id, initial_status, risk_level)

    # Broadcast event
    await event_bus.publish(
        "task.created",
        {"task_id": task_id, "title": title, "status": initial_status, "risk_level": risk_level},
    )

    return TaskResponse(
        id=task_id,
        title=title,
        command_raw=req.command,
        status=initial_status,
        risk_level=risk_level,
        requires_approval=requires_approval,
        progress_pct=0.0,
        device_id=req.device_id,
        created_at=now,
        updated_at=now,
        steps=[],
    )


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> TaskListResponse:
    """Retrieve historical and active tasks."""
    async with get_db_connection() as conn:
        if status:
            cursor = await conn.execute(
                "SELECT COUNT(*) FROM tasks WHERE status = ?;", (status,)
            )
            count_row = await cursor.fetchone()
            total = count_row[0] if count_row else 0

            cursor = await conn.execute(
                """
                SELECT id, title, command_raw, status, risk_level,
                       requires_approval, approved_at, progress_pct,
                       device_id, result_summary, error_details,
                       created_at, updated_at, completed_at
                FROM tasks
                WHERE status = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?;
                """,
                (status, limit, offset),
            )
        else:
            cursor = await conn.execute("SELECT COUNT(*) FROM tasks;")
            count_row = await cursor.fetchone()
            total = count_row[0] if count_row else 0

            cursor = await conn.execute(
                """
                SELECT id, title, command_raw, status, risk_level,
                       requires_approval, approved_at, progress_pct,
                       device_id, result_summary, error_details,
                       created_at, updated_at, completed_at
                FROM tasks
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?;
                """,
                (limit, offset),
            )

        rows = await cursor.fetchall()

    tasks: list[TaskResponse] = []
    for r in rows:
        tasks.append(
            TaskResponse(
                id=r["id"],
                title=r["title"],
                command_raw=r["command_raw"],
                status=r["status"],
                risk_level=r["risk_level"],
                requires_approval=bool(r["requires_approval"]),
                approved_at=datetime.fromisoformat(r["approved_at"]) if r["approved_at"] else None,
                progress_pct=r["progress_pct"],
                device_id=r["device_id"],
                result_summary=r["result_summary"],
                error_details=r["error_details"],
                created_at=datetime.fromisoformat(r["created_at"]),
                updated_at=datetime.fromisoformat(r["updated_at"]),
                completed_at=datetime.fromisoformat(r["completed_at"]) if r["completed_at"] else None,
                steps=[],
            )
        )

    return TaskListResponse(total=total, tasks=tasks)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str) -> TaskResponse:
    """Retrieve details and execution steps for a specific task."""
    async with get_db_connection() as conn:
        cursor = await conn.execute(
            """
            SELECT id, title, command_raw, status, risk_level,
                   requires_approval, approved_at, progress_pct,
                   device_id, result_summary, error_details,
                   created_at, updated_at, completed_at
            FROM tasks WHERE id = ?;
            """,
            (task_id,),
        )
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

        # Query steps
        cursor_steps = await conn.execute(
            """
            SELECT id, step_order, action_type, status, output_data, started_at, finished_at
            FROM task_steps WHERE task_id = ? ORDER BY step_order ASC;
            """,
            (task_id,),
        )
        step_rows = await cursor_steps.fetchall()

    steps = [
        {
            "id": s["id"],
            "step_order": s["step_order"],
            "action_type": s["action_type"],
            "status": s["status"],
            "output_data": s["output_data"],
            "started_at": datetime.fromisoformat(s["started_at"]) if s["started_at"] else None,
            "finished_at": datetime.fromisoformat(s["finished_at"]) if s["finished_at"] else None,
        }
        for s in step_rows
    ]

    return TaskResponse(
        id=r["id"],
        title=r["title"],
        command_raw=r["command_raw"],
        status=r["status"],
        risk_level=r["risk_level"],
        requires_approval=bool(r["requires_approval"]),
        approved_at=datetime.fromisoformat(r["approved_at"]) if r["approved_at"] else None,
        progress_pct=r["progress_pct"],
        device_id=r["device_id"],
        result_summary=r["result_summary"],
        error_details=r["error_details"],
        created_at=datetime.fromisoformat(r["created_at"]),
        updated_at=datetime.fromisoformat(r["updated_at"]),
        completed_at=datetime.fromisoformat(r["completed_at"]) if r["completed_at"] else None,
        steps=steps,  # type: ignore[arg-type]
    )


@router.post("/{task_id}/approve", response_model=TaskResponse)
async def approve_task(task_id: str) -> TaskResponse:
    """Explicitly grant approval for a task held in AwaitingApproval."""
    now = datetime.now(timezone.utc)
    async with get_db_connection() as conn:
        cursor = await conn.execute(
            "SELECT status FROM tasks WHERE id = ?;", (task_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found.")
        if row["status"] != "AwaitingApproval":
            raise HTTPException(status_code=400, detail=f"Task is in '{row['status']}' state, cannot approve.")

        await conn.execute(
            """
            UPDATE tasks
            SET status = 'Queued', approved_at = ?, updated_at = ?
            WHERE id = ?;
            """,
            (now.isoformat(), now.isoformat(), task_id),
        )

        await conn.execute(
            """
            INSERT INTO audit_logs (event_type, actor, action_details, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("approval_granted", "user", f'{{"task_id": "{task_id}"}}', "High", now.isoformat()),
        )
        await conn.commit()

    await event_bus.publish("task.approved", {"task_id": task_id})
    return await get_task(task_id)


@router.post("/{task_id}/cancel", response_model=TaskResponse)
async def cancel_task(task_id: str) -> TaskResponse:
    """Safely terminate an active or queued task."""
    now = datetime.now(timezone.utc)
    async with get_db_connection() as conn:
        cursor = await conn.execute("SELECT status FROM tasks WHERE id = ?;", (task_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found.")

        await conn.execute(
            """
            UPDATE tasks
            SET status = 'Cancelled', updated_at = ?, completed_at = ?
            WHERE id = ?;
            """,
            (now.isoformat(), now.isoformat(), task_id),
        )
        await conn.commit()

    await event_bus.publish("task.cancelled", {"task_id": task_id})
    return await get_task(task_id)
