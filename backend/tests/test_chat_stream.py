"""API Tests for Streaming Endpoint and Provider Discovery.

Complies with TESTING.md and PRD Section 4.
"""

from __future__ import annotations

import json
from fastapi.testclient import TestClient


def test_list_providers_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/conversations/providers")
    assert response.status_code == 200
    providers = response.json()
    assert isinstance(providers, list)
    assert any(p["name"] == "mock" and p["available"] is True for p in providers)


def test_stream_message_endpoint(client: TestClient) -> None:
    # 1. Create a conversation
    create_resp = client.post("/api/v1/conversations", json={"title": "Streaming Test"})
    assert create_resp.status_code == 201
    conv_id = create_resp.json()["id"]

    # 2. Call stream endpoint
    with client.stream(
        "POST",
        f"/api/v1/conversations/{conv_id}/messages/stream",
        json={"content": "Stream this test sentence.", "provider": "mock"},
    ) as response:
        assert response.status_code == 200
        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                event_data = json.loads(line[6:])
                events.append(event_data)

        # Verify event sequence
        assert len(events) >= 3
        assert events[0]["event"] == "start"
        assert any(e["event"] == "token" for e in events)
        assert events[-1]["event"] == "done"

    # 3. Verify messages are persisted in conversation history
    get_resp = client.get(f"/api/v1/conversations/{conv_id}")
    assert get_resp.status_code == 200
    conv_data = get_resp.json()
    assert len(conv_data["messages"]) == 2  # user + assistant
    assert conv_data["messages"][0]["role"] == "user"
    assert conv_data["messages"][1]["role"] == "assistant"
    assert conv_data["messages"][1]["model"] == "mock:mock-echo-v1"


def test_delete_conversation_endpoint(client: TestClient) -> None:
    create_resp = client.post("/api/v1/conversations", json={"title": "To Delete"})
    conv_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/conversations/{conv_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/conversations/{conv_id}")
    assert get_resp.status_code == 404
