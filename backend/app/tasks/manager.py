"""Background Task Manager and Async Execution Supervisor.

Complies with Phase 6 requirements, PRD Section 15, and SECURITY.md:
- Asynchronous execution workers via asyncio.create_task
- Discrete states: queued, running, completed, failed, cancelled, interrupted
- Monotonic progress tracking (0.0% to 100.0%) with descriptive progress messages
- Timeout enforcement with asyncio.wait_for
- Safe cancellation without resource leakage
- Safe startup recovery for interrupted tasks (never blindly re-runs non-idempotent tasks)
- Proactive notifications for task completion and failure
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from collections.abc import Callable, Coroutine
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_session_factory
from app.models.notification import NotificationCategory, NotificationPriority
from app.models.task import BackgroundTask, TaskStatus
from app.notifications.service import get_notification_service
from app.tools.emergency import get_emergency_manager
from app.tools.security import SandboxGuard
from app.utils.logging import logger

ProgressCallback = Callable[[float, str], Coroutine[Any, Any, None]]
TaskHandler = Callable[[dict[str, Any], ProgressCallback], Coroutine[Any, Any, Any]]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskManager:
    """Manages asynchronous background jobs, execution lifecycle, and recovery."""

    _instance: TaskManager | None = None

    def __init__(self, session_factory: sessionmaker[Session] | None = None) -> None:
        self._active_tasks: dict[str, asyncio.Task[Any]] = {}
        self._handlers: dict[str, TaskHandler] = {}
        self._session_factory = session_factory
        self._register_default_handlers()

    @classmethod
    def get_instance(cls) -> TaskManager:
        if cls._instance is None:
            cls._instance = TaskManager()
        return cls._instance

    def get_session_factory(self) -> sessionmaker[Session]:
        return self._session_factory or get_session_factory()

    def set_session_factory(self, factory: sessionmaker[Session] | None) -> None:
        self._session_factory = factory

    def register_handler(self, task_type: str, handler: TaskHandler) -> None:
        """Register a coroutine handler for a specific task type."""
        self._handlers[task_type] = handler
        logger.info("Registered background task handler for type: '%s'", task_type)

    def _register_default_handlers(self) -> None:
        """Register built-in system task handlers."""
        self.register_handler("file_search", self._handle_file_search)
        self.register_handler("system_diagnostic", self._handle_system_diagnostic)
        self.register_handler("simulation", self._handle_simulation)

    async def enqueue_task(
        self,
        name: str,
        task_type: str,
        params: dict[str, Any] | None = None,
        timeout_seconds: float = 300.0,
        idempotent: bool = False,
        db: Session | None = None,
    ) -> BackgroundTask:
        """Enqueue a background task and immediately trigger async worker."""
        emergency = get_emergency_manager()
        if emergency.is_active:
            raise RuntimeError(
                f"Cannot enqueue task: Emergency Stop is engaged ({emergency.get_status().get('reason')})"
            )

        if task_type not in self._handlers:
            raise ValueError(f"Unknown task type '{task_type}'. Registered types: {list(self._handlers.keys())}")

        params = params or {}
        should_close = False
        if db is None:
            factory = get_session_factory()
            db = factory()
            should_close = True

        try:
            task = BackgroundTask(
                name=name,
                task_type=task_type,
                status=TaskStatus.QUEUED.value,
                progress=0.0,
                progress_message="Task queued and waiting to start",
                params=json.dumps(params),
                timeout_seconds=timeout_seconds,
                idempotent=idempotent,
                created_at=utc_now(),
            )
            db.add(task)
            db.commit()
            db.refresh(task)

            task_id = task.id
            logger.info("Enqueued task %s ('%s', type='%s')", task_id, name, task_type)

            # Spawn async execution supervisor
            async_task = asyncio.create_task(self._run_task(task_id, task_type, params, timeout_seconds))
            self._active_tasks[task_id] = async_task

            return task
        finally:
            if should_close:
                db.close()

    async def _run_task(
        self,
        task_id: str,
        task_type: str,
        params: dict[str, Any],
        timeout_seconds: float,
    ) -> None:
        """Worker supervisor that manages task execution, timeouts, and state transitions."""
        factory = self.get_session_factory()
        handler = self._handlers.get(task_type)

        if not handler:
            self._update_task_state(task_id, TaskStatus.FAILED.value, error=f"Missing handler for {task_type}")
            return

        # Mark task as running
        with factory() as db:
            task = db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
            if not task:
                return
            task.status = TaskStatus.RUNNING.value
            task.started_at = utc_now()
            task.progress_message = "Task execution started"
            db.commit()

        # Define progress callback
        current_progress = 0.0

        async def update_progress(percent: float, message: str) -> None:
            nonlocal current_progress
            # Enforce monotonic progress between 0.0 and 100.0
            new_val = max(current_progress, min(100.0, float(percent)))
            current_progress = new_val

            with factory() as p_db:
                t = p_db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
                if t and not t.is_terminal():
                    t.progress = new_val
                    t.progress_message = message
                    p_db.commit()

        try:
            # Check Emergency Stop before execution
            if get_emergency_manager().is_active:
                raise RuntimeError("Halted: Emergency Stop engaged prior to execution")

            # Run with timeout enforcement
            result = await asyncio.wait_for(
                handler(params, update_progress),
                timeout=timeout_seconds,
            )

            # Mark completed
            self._update_task_state(
                task_id,
                TaskStatus.COMPLETED.value,
                progress=100.0,
                progress_message="Task completed successfully",
                result=result,
            )

            # Trigger proactive notification on success
            self._notify_task_event(
                task_id=task_id,
                title="Task Completed",
                message=f"Background task '{params.get('name', task_type)}' finished successfully.",
                priority=NotificationPriority.NORMAL.value,
            )

        except asyncio.CancelledError:
            logger.info("Task %s was cancelled", task_id)
            self._update_task_state(
                task_id,
                TaskStatus.CANCELLED.value,
                progress_message="Task cancelled by user",
                cancelled_at=utc_now(),
            )
            self._notify_task_event(
                task_id=task_id,
                title="Task Cancelled",
                message=f"Background task {task_id} was cancelled.",
                priority=NotificationPriority.NORMAL.value,
            )

        except asyncio.TimeoutError:
            err_msg = f"Task exceeded maximum timeout limit of {timeout_seconds} seconds"
            logger.error("Task %s timed out: %s", task_id, err_msg)
            self._update_task_state(
                task_id,
                TaskStatus.FAILED.value,
                progress_message="Task timed out",
                error=err_msg,
            )
            self._notify_task_event(
                task_id=task_id,
                title="Task Timed Out",
                message=err_msg,
                priority=NotificationPriority.HIGH.value,
            )

        except Exception as exc:
            err_msg = str(exc)
            logger.error("Task %s failed with exception: %s", task_id, err_msg, exc_info=True)
            self._update_task_state(
                task_id,
                TaskStatus.FAILED.value,
                progress_message="Task failed with error",
                error=err_msg,
            )
            self._notify_task_event(
                task_id=task_id,
                title="Task Failed",
                message=f"Background task encountered an error: {err_msg}",
                priority=NotificationPriority.HIGH.value,
            )

        finally:
            self._active_tasks.pop(task_id, None)

    def _update_task_state(
        self,
        task_id: str,
        status: str,
        progress: float | None = None,
        progress_message: str | None = None,
        result: Any = None,
        error: str | None = None,
        cancelled_at: datetime | None = None,
    ) -> None:
        """Atomically update task state in the database."""
        factory = self.get_session_factory()
        with factory() as db:
            task = db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
            if not task:
                return

            task.status = status
            if progress is not None:
                task.progress = progress
            if progress_message is not None:
                task.progress_message = progress_message
            if result is not None:
                task.result = json.dumps(result) if not isinstance(result, str) else result
            if error is not None:
                task.error = error
            if cancelled_at is not None:
                task.cancelled_at = cancelled_at

            if status in {TaskStatus.COMPLETED.value, TaskStatus.FAILED.value}:
                task.completed_at = utc_now()

            db.commit()

    def _notify_task_event(self, task_id: str, title: str, message: str, priority: str) -> None:
        """Safely trigger notification for a task event."""
        try:
            notif_service = get_notification_service()
            notif_service.post_notification(
                title=title,
                message=message,
                priority=priority,
                category=NotificationCategory.TASK.value,
                metadata={"task_id": task_id},
            )
        except Exception as e:
            logger.debug("Failed to dispatch task notification: %s", e)

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running or queued background task."""
        async_task = self._active_tasks.get(task_id)
        if async_task and not async_task.done():
            async_task.cancel()
            return True

        # If not actively tracked in memory, check if still marked queued/running in database
        factory = self.get_session_factory()
        with factory() as db:
            task = db.execute(select(BackgroundTask).where(BackgroundTask.id == task_id)).scalar_one_or_none()
            if task and not task.is_terminal():
                task.status = TaskStatus.CANCELLED.value
                task.cancelled_at = utc_now()
                task.progress_message = "Task cancelled while waiting"
                db.commit()
                return True

        return False

    def recover_interrupted_tasks(self, db: Session | None = None) -> list[str]:
        """Inspect and safely resolve orphaned tasks from prior crashes or restarts.

        Non-idempotent tasks are marked INTERRUPTED to prevent duplicate side effects.
        """
        interrupted_ids: list[str] = []

        def _do_recovery(session: Session) -> None:
            orphaned = session.execute(
                select(BackgroundTask).where(
                    BackgroundTask.status.in_([TaskStatus.RUNNING.value, TaskStatus.QUEUED.value])
                )
            ).scalars().all()

            for task in orphaned:
                task.status = TaskStatus.INTERRUPTED.value
                task.error = "Application restarted while task was in progress. Execution halted for safety."
                task.completed_at = utc_now()
                task.progress_message = "Interrupted by system restart"
                interrupted_ids.append(task.id)
                logger.warning(
                    "Recovered orphaned task %s ('%s'): marked as %s",
                    task.id,
                    task.name,
                    task.status,
                )

            if interrupted_ids:
                session.commit()

        if db is not None:
            _do_recovery(db)
        else:
            factory = self.get_session_factory()
            with factory() as session:
                _do_recovery(session)

        return interrupted_ids

    # -------------------------------------------------------------------------
    # Built-in Task Handlers
    # -------------------------------------------------------------------------

    async def _handle_file_search(
        self,
        params: dict[str, Any],
        update_progress: ProgressCallback,
    ) -> dict[str, Any]:
        """Deep file search job scanning allowed directories with progress reporting."""
        pattern = params.get("pattern", ".*")
        root_dir = params.get("directory", r"f:\Jarvis")
        max_results = int(params.get("max_results", 50))

        # Security check: must resolve within allowed sandbox
        resolved_root = SandboxGuard.validate_path(root_dir)
        compiled_regex = re.compile(pattern, re.IGNORECASE)

        await update_progress(5.0, f"Scanning root directory {resolved_root}...")

        all_entries: list[dict[str, Any]] = []
        scanned_dirs = 0

        # Walk directory asynchronously with periodic yields
        for root, dirs, files in os.walk(resolved_root):
            # Check Emergency Stop during long search
            if get_emergency_manager().is_active:
                raise RuntimeError("Search halted: Emergency Stop engaged")

            scanned_dirs += 1
            if scanned_dirs % 5 == 0:
                progress_val = min(85.0, 5.0 + (scanned_dirs * 2.0))
                await update_progress(progress_val, f"Scanned {scanned_dirs} directories, found {len(all_entries)} matches...")
                await asyncio.sleep(0.01)

            # Skip common large/ignored directories
            dirs[:] = [d for d in dirs if d not in {".git", ".venv", "node_modules", "__pycache__", ".pytest_cache"}]

            for f in files:
                if compiled_regex.search(f):
                    full_path = os.path.join(root, f)
                    try:
                        stat = os.stat(full_path)
                        all_entries.append({
                            "name": f,
                            "path": full_path,
                            "size_bytes": stat.st_size,
                            "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                        })
                    except Exception:
                        continue

                    if len(all_entries) >= max_results:
                        break

            if len(all_entries) >= max_results:
                break

        await update_progress(95.0, "Finalizing search results...")
        await asyncio.sleep(0.05)

        return {
            "root_directory": str(resolved_root),
            "pattern": pattern,
            "total_matches": len(all_entries),
            "scanned_directories": scanned_dirs,
            "results": all_entries,
        }

    async def _handle_system_diagnostic(
        self,
        params: dict[str, Any],
        update_progress: ProgressCallback,
    ) -> dict[str, Any]:
        """Comprehensive multi-phase system health diagnostic task."""
        import psutil
        from app.database import verify_database_health
        from app.devices.detector import DeviceDetector

        report: dict[str, Any] = {}

        # Phase 1: CPU & System load
        await update_progress(15.0, "Auditing CPU metrics and process workload...")
        await asyncio.sleep(0.1)
        cpu_usage = psutil.cpu_percent(interval=0.2)
        cpu_cores = psutil.cpu_count(logical=True)
        report["cpu"] = {
            "usage_percent": cpu_usage,
            "logical_cores": cpu_cores,
            "status": "healthy" if cpu_usage < 90 else "high_load",
        }

        # Phase 2: Memory & Paging
        await update_progress(35.0, "Auditing memory allocations and virtual paging...")
        await asyncio.sleep(0.1)
        vm = psutil.virtual_memory()
        report["memory"] = {
            "total_mb": round(vm.total / (1024 * 1024), 1),
            "available_mb": round(vm.available / (1024 * 1024), 1),
            "used_percent": vm.percent,
            "status": "healthy" if vm.percent < 85 else "warning",
        }

        # Phase 3: Disk I/O & Storage
        await update_progress(55.0, "Checking disk storage and filesystem readiness...")
        await asyncio.sleep(0.1)
        disk = psutil.disk_usage("F:\\" if os.path.exists("F:\\") else "C:\\")
        report["storage"] = {
            "total_gb": round(disk.total / (1024**3), 2),
            "free_gb": round(disk.free / (1024**3), 2),
            "used_percent": disk.percent,
            "status": "healthy" if disk.percent < 90 else "low_disk_space",
        }

        # Phase 4: SQLite Database health
        await update_progress(75.0, "Validating SQLite database WAL integrity and locks...")
        await asyncio.sleep(0.1)
        db_health = verify_database_health()
        report["database"] = db_health

        # Phase 5: Hardware & Device Registry
        await update_progress(90.0, "Querying connected hardware and device peripherals...")
        await asyncio.sleep(0.1)
        devices = DeviceDetector.get_inventory()
        report["devices"] = {
            "audio_input_count": len(devices.audio_inputs),
            "audio_output_count": len(devices.audio_outputs),
            "camera_count": len(devices.cameras),
            "displays": len(devices.displays),
        }

        overall_status = (
            "healthy"
            if db_health.get("status") == "healthy" and vm.percent < 90 and cpu_usage < 95
            else "degraded"
        )
        report["overall_status"] = overall_status
        report["timestamp"] = utc_now().isoformat()

        await update_progress(100.0, f"Diagnostic complete: system status is {overall_status.upper()}")
        return report

    async def _handle_simulation(
        self,
        params: dict[str, Any],
        update_progress: ProgressCallback,
    ) -> dict[str, Any]:
        """Simulated background workload for testing and demonstrations."""
        steps = int(params.get("steps", 5))
        step_delay = float(params.get("step_delay", 0.3))
        fail_at_step = params.get("fail_at_step")

        records: list[str] = []
        for i in range(1, steps + 1):
            if get_emergency_manager().is_active:
                raise RuntimeError("Simulation aborted: Emergency Stop is active")

            if fail_at_step is not None and i == int(fail_at_step):
                raise RuntimeError(f"Simulated failure encountered at step {i}")

            percent = round((i / steps) * 100.0, 1)
            msg = f"Processed simulation stage {i}/{steps}..."
            await update_progress(percent, msg)
            records.append(f"Stage {i} processed successfully")
            await asyncio.sleep(step_delay)

        return {
            "status": "simulation_complete",
            "total_steps": steps,
            "records": records,
        }


def get_task_manager() -> TaskManager:
    return TaskManager.get_instance()
