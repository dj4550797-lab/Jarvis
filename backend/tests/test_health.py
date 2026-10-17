"""API Tests for System Health and Diagnostics Endpoint.

Complies with PRD 2.3 and TESTING.md Section 5.3.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ("healthy", "degraded")
    assert data["version"] == "0.1.0"
    assert "uptime_seconds" in data
    assert "database" in data
    assert data["database"]["status"] == "healthy"
    assert "hardware" in data
    assert data["hardware"]["os"] != ""
    assert "ai_provider" in data
    assert data["ai_provider"]["configured_provider"] == "mock"


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["name"] == "JARVIS Personal AI Assistant"
