"""SQLite Connection Manager with WAL Mode and Async Transactions."""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
import aiosqlite
from jarvis.core.config import settings
from jarvis.core.logging import logger

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Async context manager yielding a configured SQLite connection."""
    settings.ensure_directories()
    db_path = str(settings.JARVIS_DB_PATH)

    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row

    try:
        # Enforce WAL mode, foreign keys, and busy timeout
        await conn.execute("PRAGMA journal_mode = WAL;")
        await conn.execute("PRAGMA synchronous = NORMAL;")
        await conn.execute("PRAGMA foreign_keys = ON;")
        await conn.execute("PRAGMA busy_timeout = 5000;")
        yield conn
    finally:
        await conn.close()


async def init_db() -> None:
    """Initialize the SQLite database schema and baseline provider records."""
    logger.info("Initializing SQLite database at %s...", settings.JARVIS_DB_PATH)
    settings.ensure_directories()

    async with get_db_connection() as conn:
        # Read and execute schema definition
        if SCHEMA_PATH.exists():
            schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
            await conn.executescript(schema_sql)
            await conn.commit()
            logger.info("Database schema applied successfully.")

        # Record migration v1.0.0
        await conn.execute(
            """
            INSERT OR IGNORE INTO schema_migrations (version, name)
            VALUES (?, ?)
            """,
            ("v1.0.0", "Baseline Schema"),
        )

        # Seed default local engine providers if not present
        await conn.execute(
            """
            INSERT OR IGNORE INTO providers (id, name, provider_type, is_enabled, is_local)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("local-gguf", "Local GGUF Engine (llama.cpp)", "local_engine", 1, 1),
        )
        await conn.execute(
            """
            INSERT OR IGNORE INTO providers (id, name, provider_type, is_enabled, is_local, endpoint_url)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("ollama", "Ollama Local Service", "ollama", 1, 1, settings.OLLAMA_BASE_URL),
        )

        await conn.commit()
        logger.info("Baseline seed data verified.")


async def checkpoint_db() -> None:
    """Flush SQLite write-ahead log to main database file."""
    async with get_db_connection() as conn:
        await conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
        logger.info("SQLite WAL checkpoint completed.")
