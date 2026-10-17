"""Pytest Fixtures for Backend Testing.

Sets up isolated temporary SQLite databases and test clients per TESTING.md.
"""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Force testing environment before importing app modules
os.environ["JARVIS_ENV"] = "testing"
os.environ["JARVIS_AI_PROVIDER"] = "mock"
os.environ["JARVIS_LOG_LEVEL"] = "DEBUG"

from app.config import Settings, get_settings
from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="session")
def test_settings(tmp_path_factory: pytest.TempPathFactory) -> Settings:
    """Fixture providing isolated temporary test settings."""
    temp_dir = tmp_path_factory.mktemp("jarvis_test_data")
    settings = Settings(
        env="testing",
        data_dir=temp_dir,
        database_url=f"sqlite:///{(temp_dir / 'test_jarvis.db').as_posix()}",
        ai_provider="mock",
        enable_diagnostics=True,
    )
    return settings


@pytest.fixture(scope="function")
def db_session(tmp_path: Path) -> Generator[Session, None, None]:
    """Fixture providing a fresh in-memory or temp SQLite session for each test."""
    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient fixture with dependency override for get_db."""
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
