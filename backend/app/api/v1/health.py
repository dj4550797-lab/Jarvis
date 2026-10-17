"""Health and Diagnostics Endpoint.

Implements /api/v1/health returning real-time subsystem readiness,
database verification, and hardware diagnostics per PRD 2.3 and 3.2.
"""

from __future__ import annotations

import os
import platform
import shutil
import time
from typing import Any

from fastapi import APIRouter, status

from app.config import get_settings
from app.database import verify_database_health
from app.schemas.health import (
    AIProviderStatus,
    DatabaseHealth,
    HealthResponse,
    SystemHardware,
)

router = APIRouter(tags=["health"])

_START_TIME = time.time()


def get_hardware_diagnostics() -> SystemHardware:
    """Collect safe, real-time hardware diagnostics using standard libraries."""
    settings = get_settings()
    data_dir = settings.resolve_data_dir()

    # Free disk space in data directory
    try:
        disk_usage = shutil.disk_usage(data_dir)
        free_gb = round(disk_usage.free / (1024**3), 2)
    except Exception:
        free_gb = None

    # RAM and CPU count
    cpu_logical = os.cpu_count()

    # Total RAM on Windows/Unix
    ram_gb: float | None = None
    try:
        if platform.system() == "Windows":
            import ctypes

            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong),
                    ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong),
                    ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong),
                    ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong),
                    ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]

            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(stat)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
                ram_gb = round(stat.ullTotalPhys / (1024**3), 2)
    except Exception:
        ram_gb = None

    return SystemHardware(
        os=f"{platform.system()} {platform.release()}",
        os_version=platform.version(),
        architecture=platform.machine(),
        cpu_logical=cpu_logical,
        ram_total_gb=ram_gb,
        disk_free_gb=free_gb,
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get application health and diagnostics status",
)
def get_health() -> HealthResponse:
    """Return live system health, database status, and hardware metrics."""
    settings = get_settings()
    db_health_raw = verify_database_health()
    db_health = DatabaseHealth(
        status=db_health_raw.get("status", "unknown"),
        journal_mode=db_health_raw.get("journal_mode"),
        foreign_keys=db_health_raw.get("foreign_keys"),
        url=settings.resolve_database_url(),
    )

    uptime = round(time.time() - _START_TIME, 2)
    hardware = get_hardware_diagnostics()

    # AI Provider readiness status
    provider_status = "not_configured"
    if settings.ai_provider == "mock":
        provider_status = "available"  # Mock provider is always available for testing
    elif settings.ai_provider == "ollama":
        provider_status = "not_configured" if not settings.local_model_enabled else "available"

    ai_status = AIProviderStatus(
        configured_provider=settings.ai_provider,
        local_model_enabled=settings.local_model_enabled,
        local_model_name=settings.local_model_name,
        status=provider_status,
    )

    overall_status = "healthy"
    if db_health.status != "healthy":
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        version="0.1.0",
        environment=settings.env,
        uptime_seconds=uptime,
        database=db_health,
        hardware=hardware,
        ai_provider=ai_status,
        data_directory=str(settings.resolve_data_dir()),
    )
