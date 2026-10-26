"""JARVIS Central Brain FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from jarvis.api import backups, diagnostics, health, memories, models, providers, tasks, voice, websocket
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
        "http://127.0.0.1:8000",
        "http://localhost:8000",
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


# Register API Routers (Phase 1, 2 & 3)
app.include_router(health.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(memories.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(diagnostics.router, prefix="/api/v1")
app.include_router(backups.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(websocket.router)

# Locate Frontend Dist for Static Delivery
def get_frontend_dist() -> Path:
    import sys
    # If running packaged inside PyInstaller
    if getattr(sys, "frozen", False):
        meipass_dist = Path(getattr(sys, "_MEIPASS", "")) / "dist"
        if meipass_dist.exists():
            return meipass_dist
        exe_dist = Path(sys.executable).parent / "dist"
        if exe_dist.exists():
            return exe_dist

    # Check parent workspace
    ws_dist = Path(__file__).resolve().parent.parent.parent.parent / "apps" / "desktop" / "dist"
    if ws_dist.exists():
        return ws_dist
    # Check bundled relative path
    pkg_dist = Path(__file__).resolve().parent / "dist"
    return pkg_dist


_frontend_dist = get_frontend_dist()
if (_frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="assets")


@app.get("/")
async def root(request: Request):
    """Root endpoint: serves React UI for browsers, or JSON metadata for API clients."""
    accept_header = request.headers.get("accept", "")
    index_file = _frontend_dist / "index.html"

    if "text/html" in accept_header and index_file.exists():
        return FileResponse(index_file)

    return {
        "service": "JARVIS Central Brain",
        "status": "operational",
        "version": "0.1.0",
        "docs_url": "/docs",
    }
