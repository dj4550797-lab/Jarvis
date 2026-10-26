"""Integration tests for SQLite persistence, WAL mode, and FTS5 search."""

import pytest
from pathlib import Path
from jarvis.core.config import settings
from jarvis.database.connection import get_db_connection, init_db


@pytest.mark.asyncio
async def test_database_initialization(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify that init_db creates all required tables and seeds default providers."""
    test_db = tmp_path / "test_jarvis.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)

    await init_db()
    assert test_db.exists()

    async with get_db_connection() as conn:
        # Check WAL mode
        cursor = await conn.execute("PRAGMA journal_mode;")
        row = await cursor.fetchone()
        assert row is not None
        assert row[0].lower() == "wal"

        # Check migrations table
        cursor = await conn.execute("SELECT version FROM schema_migrations WHERE version = 'v1.0.0';")
        migration = await cursor.fetchone()
        assert migration is not None

        # Check seeded providers
        cursor = await conn.execute("SELECT id, name FROM providers WHERE id = 'local-gguf';")
        provider = await cursor.fetchone()
        assert provider is not None
        assert provider["name"] == "Local GGUF Engine (llama.cpp)"


@pytest.mark.asyncio
async def test_memory_fts5_indexing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify that inserting a memory indexes it in FTS5 and enables keyword matching."""
    test_db = tmp_path / "test_fts.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)

    await init_db()

    async with get_db_connection() as conn:
        cursor = await conn.execute(
            """
            INSERT INTO memories (id, memory_type, category, content, importance, is_sensitive)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            ("mem-1", "fact", "coding", "Python 3.12 is the primary backend runtime", 1.0, 0),
        )
        rowid = cursor.lastrowid

        await conn.execute(
            "INSERT INTO memories_fts (rowid, content, category) VALUES (?, ?, ?);",
            (rowid, "Python 3.12 is the primary backend runtime", "coding"),
        )
        await conn.commit()

        # FTS5 Match
        fts_cursor = await conn.execute(
            "SELECT content FROM memories_fts WHERE memories_fts MATCH '\"Python 3.12\"*';"
        )
        matched = await fts_cursor.fetchone()
        assert matched is not None
        assert "Python 3.12" in matched[0]
