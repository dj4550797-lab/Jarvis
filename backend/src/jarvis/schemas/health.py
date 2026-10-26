"""Health & Diagnostic Schemas."""

from typing import Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    connected: bool = True
    wal_enabled: bool = True
    schema_version: str = "v1.0.0"
    total_tasks: int = 0
    total_memories: int = 0


class LocalAIHealth(BaseModel):
    model_loaded: str | None = None
    runtime: str = "llama.cpp / modular"
    device: str = "cpu"
    status: str = "ready_for_models"


class SystemResources(BaseModel):
    cpu_pct: float
    ram_used_mb: float
    ram_total_mb: float
    disk_free_gb: float


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    mode: str = Field(description="'offline' or 'online_hybrid'")
    database: DatabaseHealth
    local_ai: LocalAIHealth
    system_resources: SystemResources


class StatusResponse(BaseModel):
    current_phase: str
    completed_features: list[str]
    current_task: str
    tests_summary: dict[str, Any]
    open_failures: list[str]
    blockers: list[str]
    files_changed: list[str]
    git_status: dict[str, str]
    memory_state: str
    next_exact_action: str
