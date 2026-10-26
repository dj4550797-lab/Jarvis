"""JARVIS Central Brain FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jarvis.api import backups, diagnostics, health, memories, providers, tasks, websocket
from jarvis.core.config import settings
from jarvis.core.logging import logger
from jarvis.database.connection import checkpoint_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for initialization and graceful teardown."""
    logger.info("Starting JARVIS Central Brain (Mode: %s)...", "Offline" if settings.JARVIS_OFFLINE_MODE else "Hybrid")
    settings.ensure_directories()
    await init_db()
    logger.info("JARVIS Central Brain initialized successfully on %s:%d", settings.JARVIS_HOST, settings.JARVIS_PORT)
    yield
    logger.info("Shutting down JARVIS Central Brain...")
    await checkpoint_db()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="JARVIS Central Brain API",
    description="Autonomous Personal AI Assistant Core Service Layer",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) for local desktop and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RFC 7807 Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled server exception at %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "type": "https://jarvis.local/errors/internal-error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An internal system error occurred. Diagnostic logs recorded.",
            "instance": request.url.path,
        },
    )

# Register API Routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(memories.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(diagnostics.router, prefix="/api/v1")
app.include_router(backups.router, prefix="/api/v1")
app.include_router(websocket.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root redirect / index greeting."""
    return {
        "service": "JARVIS Central Brain",
        "status": "operational",
        "version": "0.1.0",
        "docs_url": "/docs",
    }
