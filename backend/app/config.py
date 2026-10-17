"""JARVIS Configuration and Environment Management.

Defines authoritative application settings, environment validation,
and safe directory resolution per CONFIGURATION.md and SECURITY.md.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Authoritative settings for the JARVIS application."""

    model_config = SettingsConfigDict(
        env_prefix="JARVIS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core environment
    env: Literal["development", "testing", "production"] = Field(
        default="development",
        description="Application runtime environment mode",
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging verbosity level",
    )

    # File paths
    data_dir: Path | None = Field(
        default=None,
        description="Base directory for persistent application data, SQLite, and logs",
    )
    database_url: str | None = Field(
        default=None,
        description="SQLAlchemy database connection URL",
    )

    # Server binding (loopback only by default)
    host: str = Field(
        default="127.0.0.1",
        description="Local interface to bind the API server to",
    )
    port: int = Field(
        default=8000,
        description="Local port for the API server",
    )

    # AI Provider configuration
    ai_provider: str = Field(
        default="mock",
        description="Active AI provider (mock, ollama, openai, anthropic)",
    )
    local_model_enabled: bool = Field(
        default=False,
        description="Whether local model inference is enabled",
    )
    local_model_base_url: str = Field(
        default="http://127.0.0.1:11434",
        description="Base URL for local Ollama instance",
    )
    local_model_name: str = Field(
        default="llama3.2:latest",
        description="Configured local model name",
    )

    # Cloud AI Credentials (Optional — kept secret)
    openai_api_key: str | None = Field(default=None)
    anthropic_api_key: str | None = Field(default=None)
    google_api_key: str | None = Field(default=None)
    openrouter_api_key: str | None = Field(default=None)

    # Diagnostics
    enable_diagnostics: bool = Field(
        default=True,
        description="Enable internal diagnostics and health endpoints",
    )

    # Memory Configuration (Phase 3)
    auto_memory_enabled: bool = Field(
        default=True,
        description="Whether automatic persistent memory retrieval/injection is enabled",
    )
    max_active_memories: int = Field(
        default=15,
        description="Maximum active memory context items injected into conversation prompt",
    )

    @field_validator("port")
    @classmethod
    def validate_port(cls, v: int) -> int:
        if not (1024 <= v <= 65535):
            raise ValueError(f"Port must be between 1024 and 65535, got {v}")
        return v

    @field_validator("host")
    @classmethod
    def validate_host(cls, v: str) -> str:
        # Enforce loopback binding for security
        allowed = {"127.0.0.1", "localhost", "::1"}
        if v not in allowed:
            raise ValueError(f"Host binding must be loopback ({allowed}), got '{v}'")
        return v

    def resolve_data_dir(self) -> Path:
        """Resolve the authoritative persistent data directory."""
        if self.data_dir:
            path = Path(self.data_dir).expanduser().resolve()
        elif self.env == "testing":
            path = Path("./data/test").resolve()
        elif sys.platform == "win32":
            local_app_data = os.environ.get("LOCALAPPDATA")
            if local_app_data:
                path = Path(local_app_data) / "JARVIS"
            else:
                path = Path.home() / "AppData" / "Local" / "JARVIS"
        else:
            xdg = os.environ.get("XDG_DATA_HOME")
            if xdg:
                path = Path(xdg) / "jarvis"
            else:
                path = Path.home() / ".local" / "share" / "jarvis"

        path.mkdir(parents=True, exist_ok=True)
        return path

    def resolve_database_url(self) -> str:
        """Resolve the SQLite database URL."""
        if self.database_url:
            return self.database_url
        data_dir = self.resolve_data_dir()
        db_file = data_dir / "jarvis.db"
        # Format as SQLite URL with forward slashes
        return f"sqlite:///{db_file.as_posix()}"

    def safe_dict(self) -> dict:
        """Return configuration dictionary with secrets redacted."""
        data = self.model_dump()
        redacted_fields = {
            "openai_api_key",
            "anthropic_api_key",
            "google_api_key",
            "openrouter_api_key",
        }
        for field in redacted_fields:
            if data.get(field):
                data[field] = "[REDACTED]"
            else:
                data[field] = None
        data["resolved_data_dir"] = str(self.resolve_data_dir())
        data["resolved_database_url"] = self.resolve_database_url()
        return data


# Authoritative global settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or initialize the authoritative settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
