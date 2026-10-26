"""Unit tests for Settings and Configuration."""

from pathlib import Path
from jarvis.core.config import Settings


def test_settings_defaults() -> None:
    """Verify default configuration values."""
    s = Settings(
        JARVIS_DATA_DIR=Path("./tmp_test_data"),
        JARVIS_DB_PATH=Path("./tmp_test_data/test.db"),
    )
    assert s.JARVIS_PORT == 8000
    assert s.JARVIS_OFFLINE_MODE is True
    assert s.JARVIS_ALLOW_CLOUD_FALLBACK is False
    assert s.JARVIS_SPEECH_ENGINE == "offline"


def test_ensure_directories(tmp_path: Path) -> None:
    """Verify that ensure_directories creates required directories."""
    data_dir = tmp_path / "data"
    models_dir = tmp_path / "models"
    backup_dir = tmp_path / "backups"

    s = Settings(
        JARVIS_DATA_DIR=data_dir,
        JARVIS_MODELS_DIR=models_dir,
        JARVIS_BACKUP_DIR=backup_dir,
    )
    s.ensure_directories()

    assert data_dir.exists()
    assert models_dir.exists()
    assert backup_dir.exists()
