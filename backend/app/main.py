"""JARVIS Backend Application Entrypoint.

Implements FastAPI application with:
- Strict local CORS policy
- Safe startup and shutdown lifecycle
- Centralized logging and error handling
- Database initialization and verification
- Redacted error responses per SECURITY.md
"""

from __future__ import annotations

import sys
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import v1_router
from app.config import get_settings
from app.database import get_engine, init_db
from app.models.audit import AuditLog
from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    settings = get_settings()
    logger.info(
        "Starting JARVIS backend v0.1.0 in %s mode on %s:%d",
        settings.env,
        settings.host,
        settings.port,
    )

    # 1. Initialize and verify SQLite database
    try:
        init_db()
        logger.info("Database initialized at %s", settings.resolve_database_url())
    except Exception as exc:
        logger.critical("Fatal: Failed to initialize database: %s", exc, exc_info=True)
        sys.exit(1)

    # 2. Crash/Restart recovery for in-flight background tasks
    try:
        from app.tasks.manager import get_task_manager
        recovered = get_task_manager().recover_interrupted_tasks()
        if recovered:
            logger.info("Recovered %d interrupted background tasks on startup: %s", len(recovered), recovered)
    except Exception as exc:
        logger.warning("Task recovery check encountered an issue: %s", exc)

    yield

    # Shutdown logic
    logger.info("Shutting down JARVIS backend...")
    engine = get_engine()
    engine.dispose()
    logger.info("Database connections disposed cleanly.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title="JARVIS Personal AI Assistant Backend",
        version="0.1.0",
        description="Local-first personal AI assistant core services",
        docs_url="/docs" if settings.env == "development" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # Local CORS middleware for frontend communication
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "tauri://localhost",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Global Exception Handler (sanitized, no leaking secrets or full internal tracebacks)
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled server exception on %s: %s", request.url.path, exc, exc_info=True)
        detail = "An internal server error occurred." if settings.env == "production" else str(exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "error", "detail": detail},
        )

    # Mount API routes
    app.include_router(v1_router)

    @app.get("/", tags=["root"])
    def root() -> dict[str, Any]:
        return {
            "name": "JARVIS Personal AI Assistant",
            "version": "0.1.0",
            "status": "online",
            "environment": settings.env,
        }

    return app


app = create_app()
