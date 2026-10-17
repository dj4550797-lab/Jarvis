"""API Integration Tests for Memory Endpoints.

Complies with PRD Section 11 and TESTING.md Section 7.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_and_get_memory_api(client: TestClient) -> None:
    # 1. Create a memory
    create_resp = client.post(
        "/api/v1/memories",
        json={
            "content": "User prefers concise function docstrings.",
            "memory_type": "preference",
            "category": "coding",
            "tags": ["python", "style"],
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["content"] == "User prefers concise function docstrings."
    assert created["memory_type"] == "preference"
    assert created["category"] == "coding"
    assert "python" in created["tags"]
    mem_id = created["id"]

    # 2. Get the memory by ID
    get_resp = client.get(f"/api/v1/memories/{mem_id}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["id"] == mem_id
    assert fetched["content"] == created["content"]


def test_create_memory_with_secret_rejected_by_api(client: TestClient) -> None:
    # Attempt to save OpenAI API key in memory
    resp = client.post(
        "/api/v1/memories",
        json={
            "content": "Key for backup service: sk-abcdefghijklmnopqrstuvwxyz1234567890",
            "memory_type": "explicit_fact",
        },
    )
    assert resp.status_code == 422
    data = resp.json()
    assert "Security policy violation" in data["detail"]


def test_list_and_search_memories_api(client: TestClient) -> None:
    client.post("/api/v1/memories", json={"content": "Alpha project utilizes PostgreSQL", "memory_type": "project_context"})
    client.post("/api/v1/memories", json={"content": "Beta project utilizes SQLite WAL", "memory_type": "project_context"})

    # Search for SQLite
    search_resp = client.get("/api/v1/memories?query=SQLite")
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert results["total"] == 1
    assert "SQLite" in results["items"][0]["content"]


def test_update_and_delete_memory_api(client: TestClient) -> None:
    create_resp = client.post("/api/v1/memories", json={"content": "Original note", "memory_type": "reminder"})
    mem_id = create_resp.json()["id"]

    # Update
    update_resp = client.put(f"/api/v1/memories/{mem_id}", json={"content": "Updated permanent fact", "memory_type": "explicit_fact"})
    assert update_resp.status_code == 200
    assert update_resp.json()["content"] == "Updated permanent fact"

    # Delete
    del_resp = client.delete(f"/api/v1/memories/{mem_id}")
    assert del_resp.status_code == 204

    # Verify not found
    get_resp = client.get(f"/api/v1/memories/{mem_id}")
    assert get_resp.status_code == 404


def test_clear_memory_confirmation_flow(client: TestClient) -> None:
    client.post("/api/v1/memories", json={"content": "Fact A", "memory_type": "explicit_fact"})
    client.post("/api/v1/memories", json={"content": "Fact B", "memory_type": "explicit_fact"})

    # Clear without confirm: true must fail
    fail_resp = client.post("/api/v1/memories/clear", json={"confirm": False})
    assert fail_resp.status_code == 400

    # Clear with confirm: true must succeed
    succ_resp = client.post("/api/v1/memories/clear", json={"confirm": True})
    assert succ_resp.status_code == 200
    assert succ_resp.json()["deleted_count"] >= 2

    # Verify empty
    list_resp = client.get("/api/v1/memories")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 0


def test_export_memories_api(client: TestClient) -> None:
    client.post("/api/v1/memories", json={"content": "Exportable Fact", "memory_type": "explicit_fact"})
    
    export_resp = client.get("/api/v1/memories/export")
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    assert "total_records" in export_data
    assert export_data["total_records"] >= 1
    assert any(m["content"] == "Exportable Fact" for m in export_data["memories"])
