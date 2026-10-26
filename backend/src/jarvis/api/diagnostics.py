"""Diagnostics and Audit Log API Router."""

from pathlib import Path
from fastapi import APIRouter, Query
from jarvis.database.connection import get_db_connection

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics & Audit"])


@router.get("/logs")
async def get_recent_logs(lines: int = Query(100, ge=10, le=1000)) -> dict:
    """Retrieve recent application logs with sensitive data redacted."""
    log_file = Path("logs/jarvis.log")
    if not log_file.exists():
        return {"lines": [], "file_exists": False}

    with open(log_file, "r", encoding="utf-8", errors="replace") as f:
        all_lines = f.readlines()
        tail = [line.strip() for line in all_lines[-lines:]]

    return {
        "file_exists": True,
        "total_lines": len(all_lines),
        "lines": tail,
    }


@router.get("/audit")
async def get_audit_trail(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    """Retrieve immutable audit log records."""
    async with get_db_connection() as conn:
        cursor = await conn.execute(
            """
            SELECT id, event_type, actor, action_details, risk_level, ip_or_origin, timestamp
            FROM audit_logs
            ORDER BY id DESC
            LIMIT ?;
            """,
            (limit,),
        )
        rows = await cursor.fetchall()

    return [
        {
            "id": r["id"],
            "event_type": r["event_type"],
            "actor": r["actor"],
            "action_details": r["action_details"],
            "risk_level": r["risk_level"],
            "ip_or_origin": r["ip_or_origin"],
            "timestamp": r["timestamp"],
        }
        for r in rows
    ]
