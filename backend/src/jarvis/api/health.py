"""System Health and Diagnostic API Endpoints."""

import shutil
import psutil
from fastapi import APIRouter
from jarvis.core.config import settings
from jarvis.database.connection import get_db_connection
from jarvis.schemas.health import (
    DatabaseHealth,
    HealthResponse,
    LocalAIHealth,
    StatusResponse,
    SystemResources,
)

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Retrieve live system health, resource utilization, and component readiness."""
    # Query database statistics
    total_tasks = 0
    total_memories = 0
    db_connected = False

    try:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT COUNT(*) FROM tasks;")
            row = await cursor.fetchone()
            if row:
                total_tasks = row[0]

            cursor = await conn.execute("SELECT COUNT(*) FROM memories;")
            row = await cursor.fetchone()
            if row:
                total_memories = row[0]

            db_connected = True
    except Exception:
        db_connected = False

    # Query system resource metrics
    vm = psutil.virtual_memory()
    disk = shutil.disk_usage(str(settings.JARVIS_DATA_DIR.resolve()))

    system_resources = SystemResources(
        cpu_pct=psutil.cpu_percent(interval=None),
        ram_used_mb=round((vm.total - vm.available) / (1024 * 1024), 1),
        ram_total_mb=round(vm.total / (1024 * 1024), 1),
        disk_free_gb=round(disk.free / (1024 * 1024 * 1024), 2),
    )

    mode = "offline" if settings.JARVIS_OFFLINE_MODE else "online_hybrid"

    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        version="0.1.0",
        mode=mode,
        database=DatabaseHealth(
            connected=db_connected,
            wal_enabled=True,
            schema_version="v1.0.0",
            total_tasks=total_tasks,
            total_memories=total_memories,
        ),
        local_ai=LocalAIHealth(
            model_loaded=None,
            runtime="llama.cpp / GGUF",
            device="cpu",
            status="ready_for_models",
        ),
        system_resources=system_resources,
    )


@router.get("/status", response_model=StatusResponse)
async def get_status() -> StatusResponse:
    """Return the standardized 10-point project health report."""
    return StatusResponse(
        current_phase="Phase 1 — Foundation & Core Scaffolding",
        completed_features=[
            "Phase 0: Repository audit, Git initialization, and canonical documentation suite.",
            "Phase 1: Backend package scaffolding, config management, and structured logging.",
            "Phase 1: SQLite persistence engine with WAL mode and baseline migrations.",
        ],
        current_task="TSK-001 / TSK-003: Core API Endpoints & React Desktop Scaffolding",
        tests_summary={
            "toolchains_verified": ["Node v24.18.0", "npm 11.16.0", "Python 3.12.10", "Git 2.42+"],
            "unit_tests": "Pending execution",
        },
        open_failures=[],
        blockers=[
            "Cargo toolchain not yet in system PATH (desktop native packaging deferred; web container active)."
        ],
        files_changed=[
            "backend/pyproject.toml",
            "backend/src/jarvis/core/config.py",
            "backend/src/jarvis/core/logging.py",
            "backend/src/jarvis/core/events.py",
            "backend/src/jarvis/database/connection.py",
            "backend/src/jarvis/database/schema.sql",
            "backend/src/jarvis/schemas/health.py",
            "backend/src/jarvis/schemas/tasks.py",
            "backend/src/jarvis/schemas/memories.py",
            "backend/src/jarvis/api/health.py",
        ],
        git_status={"branch": "main", "clean": "in_progress"},
        memory_state="Canonical memory.md synchronized with Phase 0/1 progress.",
        next_exact_action="Implement tasks API, memories API, WebSocket router, and FastAPI app entrypoint.",
    )
