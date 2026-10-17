"""JARVIS Database Architecture and Connection Management.

Complies with DATABASE.md:
- SQLAlchemy 2.x
- SQLite with WAL mode, foreign keys, and 5000ms busy timeout
- Stable application data directory location
- Safe transaction handling and session lifecycle
"""

from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings
from app.utils.logging import logger


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


_engine: Engine | None = None
_SessionFactory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """Get or create the SQLAlchemy engine with SQLite hardening."""
    global _engine
    if _engine is None:
        settings = get_settings()
        db_url = settings.resolve_database_url()
        logger.info("Initializing database connection: %s", db_url)

        connect_args: dict[str, Any] = {"check_same_thread": False}
        _engine = create_engine(
            db_url,
            connect_args=connect_args,
            echo=(settings.log_level == "DEBUG"),
            future=True,
        )

        # Configure SQLite PRAGMAs for performance, integrity, and concurrency
        @event.listens_for(_engine, "connect")
        def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
            cursor = dbapi_connection.cursor()
            try:
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA busy_timeout=5000")
            finally:
                cursor.close()

    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Get or create the thread-safe sessionmaker."""
    global _SessionFactory
    if _SessionFactory is None:
        engine = get_engine()
        _SessionFactory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            expire_on_commit=False,
        )
    return _SessionFactory


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a database session."""
    factory = get_session_factory()
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def verify_database_health() -> dict[str, Any]:
    """Verify database read/write health for diagnostics."""
    from sqlalchemy import text

    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            wal_mode = conn.execute(text("PRAGMA journal_mode")).scalar()
            foreign_keys = conn.execute(text("PRAGMA foreign_keys")).scalar()
            return {
                "status": "healthy" if result == 1 else "unhealthy",
                "journal_mode": wal_mode,
                "foreign_keys": bool(foreign_keys),
                "url": get_settings().resolve_database_url(),
            }
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return {
            "status": "unhealthy",
            "error": str(exc),
            "url": get_settings().resolve_database_url(),
        }


def init_db() -> None:
    """Initialize database tables and verify schema readiness."""
    # Ensure all models are imported before creating tables
    import app.models  # noqa: F401

    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    health = verify_database_health()
    if health.get("status") != "healthy":
        raise RuntimeError(f"Database initialization failed: {health}")
    logger.info("Database initialized successfully: %s", health)
