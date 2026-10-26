"""Integration tests for FastAPI endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from pathlib import Path
from jarvis.core.config import settings
from jarvis.database.connection import init_db
from jarvis.main import app


@pytest.mark.asyncio
async def test_health_and_status_endpoints(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify that /api/v1/health and /api/v1/status return valid JSON."""
    test_db = tmp_path / "test_api.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test Root
        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert root_res.json()["service"] == "JARVIS Central Brain"

        # Test Health
        health_res = await client.get("/api/v1/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "healthy"
        assert health_data["mode"] == "offline"
        assert health_data["database"]["connected"] is True

        # Test 10-Point Status
        status_res = await client.get("/api/v1/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert "Phase 1" in status_data["current_phase"]
        assert len(status_data["completed_features"]) >= 3


@pytest.mark.asyncio
async def test_task_execution_lifecycle(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify task submission, listing, and cancellation flow."""
    test_db = tmp_path / "test_task_flow.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Submit low-risk command
        res = await client.post(
            "/api/v1/tasks/execute",
            json={"command": "Check local memory index", "device_id": "windows-desktop"},
        )
        assert res.status_code == 202
        task = res.json()
        assert task["status"] == "Queued"
        assert task["risk_level"] == "Low"
        task_id = task["id"]

        # List tasks
        list_res = await client.get("/api/v1/tasks")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1

        # Cancel task
        cancel_res = await client.post(f"/api/v1/tasks/{task_id}/cancel")
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "Cancelled"
