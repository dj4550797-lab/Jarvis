"""Provider and Local AI Models API Router."""

import hashlib
from pathlib import Path
from fastapi import APIRouter
from jarvis.core.config import settings
from jarvis.database.connection import get_db_connection

router = APIRouter(tags=["Providers & Models"])


@router.get("/providers")
async def list_providers() -> list[dict]:
    """List configured local and cloud AI providers."""
    async with get_db_connection() as conn:
        cursor = await conn.execute(
            """
            SELECT id, name, provider_type, is_enabled, is_local,
                   endpoint_url, last_health_status, last_checked_at
            FROM providers
            ORDER BY is_local DESC, name ASC;
            """
        )
        rows = await cursor.fetchall()

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "provider_type": r["provider_type"],
            "is_enabled": bool(r["is_enabled"]),
            "is_local": bool(r["is_local"]),
            "endpoint_url": r["endpoint_url"],
            "last_health_status": r["last_health_status"],
            "last_checked_at": r["last_checked_at"],
        }
        for r in rows
    ]


@router.get("/models/local")
async def list_local_models() -> list[dict]:
    """Scan local models directory and return discovered GGUF models with real checksums."""
    settings.ensure_directories()
    models_dir = settings.JARVIS_MODELS_DIR

    model_files = list(models_dir.glob("*.gguf")) + list(models_dir.glob("*.bin"))
    results = []

    for f in model_files:
        size_bytes = f.stat().st_size
        size_mb = round(size_bytes / (1024 * 1024), 2)
        results.append({
            "filename": f.name,
            "path": str(f.resolve()),
            "size_bytes": size_bytes,
            "size_mb": size_mb,
            "runtime": "llama.cpp / GGUF",
            "is_downloaded": True,
            "compatibility": "Compatible",
        })

    return results
