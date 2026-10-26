"""Application Configuration & Settings Management."""

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """JARVIS Central Configuration Schema."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Environment
    JARVIS_ENV: str = Field(default="development", description="Runtime environment")
    JARVIS_PORT: int = Field(default=8000, description="Backend API port")
    JARVIS_HOST: str = Field(default="127.0.0.1", description="Backend bind host")
    JARVIS_DEBUG: bool = Field(default=True, description="Enable debug mode")
    JARVIS_LOG_LEVEL: str = Field(default="INFO", description="Logging verbosity")

    # Local Persistence Paths
    JARVIS_DATA_DIR: Path = Field(
        default=Path("./data"), description="Root directory for application state"
    )
    JARVIS_DB_PATH: Path = Field(
        default=Path("./data/jarvis.db"), description="SQLite database path"
    )
    JARVIS_MODELS_DIR: Path = Field(
        default=Path("./models"), description="Directory for local GGUF models"
    )
    JARVIS_BACKUP_DIR: Path = Field(
        default=Path("./backups"), description="Directory for local snapshots"
    )

    # Security & Encryption
    JARVIS_SECRET_SALT: str = Field(
        default="jarvis-dev-local-salt-change-in-production",
        description="Local cryptographic salt for column encryption",
    )

    # Privacy & Dual-Mode Controls
    JARVIS_OFFLINE_MODE: bool = Field(
        default=True, description="Enforce strict offline-only execution"
    )
    JARVIS_ALLOW_CLOUD_FALLBACK: bool = Field(
        default=False, description="Strictly block cloud fallback on failure"
    )

    # Optional Cloud Providers (Only utilized if Offline Mode is explicitly disabled)
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Voice Configuration
    JARVIS_SPEECH_ENGINE: str = "offline"
    JARVIS_TTS_VOICE: str = "en-US-Neural"
    JARVIS_WAKE_WORD: str = "Jarvis"

    @property
    def JARVIS_MODE(self) -> str:
        """Operating mode string representation."""
        return "offline" if self.JARVIS_OFFLINE_MODE else "hybrid"

    def ensure_directories(self) -> None:
        """Ensure all required runtime data directories exist."""
        self.JARVIS_DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.JARVIS_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        self.JARVIS_BACKUP_DIR.mkdir(parents=True, exist_ok=True)


# Singleton settings instance
settings = Settings()
