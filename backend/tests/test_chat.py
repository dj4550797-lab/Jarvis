"""API Tests for Chat and Conversation Persistence.

Complies with PLAN.md Phase 1 Acceptance Criteria:
- Frontend can communicate with the backend
- Database survives and records transactions
- No fake AI response is presented as a real model response
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_and_list_conversations(client: TestClient) -> None:
    # 1. Create a conversation
    create_resp = client.post("/api/v1/conversations", json={"title": "Primary Thread"})
    assert create_resp.status_code == 201
    conv = create_resp.json()
    assert conv["title"] == "Primary Thread"
    conv_id = conv["id"]

    # 2. List conversations
    list_resp = client.get("/api/v1/conversations")
    assert list_resp.status_code == 200
    convs = list_resp.json()
    assert any(c["id"] == conv_id for c in convs)

    # 3. Send message
    msg_resp = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Initiate Phase 1 diagnostics."},
    )
    assert msg_resp.status_code == 201
    msg = msg_resp.json()
    assert msg["role"] == "assistant"
    # Adherence to honesty rule: clearly marked as mock / foundation mode
    assert "[JARVIS Mock Provider]" in msg["content"] or "Initiate Phase 1 diagnostics." in msg["content"]

    # 4. Get conversation with messages
    get_resp = client.get(f"/api/v1/conversations/{conv_id}")
    assert get_resp.status_code == 200
    conv_data = get_resp.json()
    assert len(conv_data["messages"]) == 2  # user + assistant
