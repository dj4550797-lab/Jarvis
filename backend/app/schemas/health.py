"""Health and Diagnostics Schemas for System Verification.

Complies with JARVIS_Master_PRD.md Section 2.3 and 3.2 (Honest Status).
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    """Database status details."""
    status: str = Field(description="Database health: healthy or unhealthy")
    journal_mode: str | None = Field(default=None, description="SQLite journal mode (e.g. wal)")
    foreign_keys: bool | None = Field(default=None, description="Whether foreign keys are enabled")
    url: str = Field(description="Configured database URL")


class SystemHardware(BaseModel):
    """Detected hardware and platform diagnostics."""
    os: str = Field(description="Operating system caption and release")
    os_version: str = Field(description="OS version string")
    architecture: str = Field(description="System processor architecture")
    cpu_cores: int | None = Field(default=None, description="Physical CPU cores")
    cpu_logical: int | None = Field(default=None, description="Logical processors")
    ram_total_gb: float | None = Field(default=None, description="Total system physical RAM in GB")
    disk_free_gb: float | None = Field(default=None, description="Free disk space in GB")


class AIProviderStatus(BaseModel):
    """Status of configured AI providers."""
    configured_provider: str = Field(description="Selected AI provider name")
    local_model_enabled: bool = Field(description="Whether local model integration is enabled")
    local_model_name: str = Field(description="Configured local model name")
    status: str = Field(description="Provider readiness status: available | not_configured | unavailable")


class HealthResponse(BaseModel):
    """System health check response."""
    status: str = Field(description="Overall application status: healthy | degraded | unhealthy")
    version: str = Field(description="JARVIS Application version")
    environment: str = Field(description="Runtime environment (development, testing, production)")
    uptime_seconds: float = Field(description="Backend process uptime in seconds")
    database: DatabaseHealth = Field(description="Database subsystem status")
    hardware: SystemHardware = Field(description="System hardware diagnostics")
    ai_provider: AIProviderStatus = Field(description="AI provider readiness")
    data_directory: str = Field(description="Authoritative persistent data directory")
