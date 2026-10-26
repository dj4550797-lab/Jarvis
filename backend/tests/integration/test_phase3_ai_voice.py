"""Integration tests for Phase 3 Local Model Inference and Voice Engine."""

import pytest
from httpx import ASGITransport, AsyncClient
from pathlib import Path
from jarvis.core.config import settings
from jarvis.database.connection import init_db
from jarvis.main import app


@pytest.mark.asyncio
async def test_model_inference_engine(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify local model generation and info endpoints."""
    test_db = tmp_path / "test_model.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check model info
        info_res = await client.get("/api/v1/models/info")
        assert info_res.status_code == 200
        info_data = info_res.json()
        assert info_data["is_loaded"] is True
        assert "active_model" in info_data

        # Generate text
        gen_res = await client.post(
            "/api/v1/models/generate",
            json={"prompt": "What is the system status?"},
        )
        assert gen_res.status_code == 200
        gen_data = gen_res.json()
        assert "JARVIS" in gen_data["response"]
        assert gen_data["mode"] == "offline"


@pytest.mark.asyncio
async def test_voice_engine_state_and_utterance(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify voice state machine transitions and utterance processing."""
    test_db = tmp_path / "test_voice.db"
    monkeypatch.setattr(settings, "JARVIS_DB_PATH", test_db)
    monkeypatch.setattr(settings, "JARVIS_DATA_DIR", tmp_path)
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check initial voice state
        state_res = await client.get("/api/v1/voice/state")
        assert state_res.status_code == 200
        assert state_res.json()["current_state"] == "idle"

        # Update voice state to listening
        update_res = await client.post("/api/v1/voice/state", json={"state": "listening"})
        assert update_res.status_code == 200
        assert update_res.json()["current_state"] == "listening"

        # Process speech utterance
        proc_res = await client.post("/api/v1/voice/process", json={"utterance": "What is your name?"})
        assert proc_res.status_code == 200
        proc_data = proc_res.json()
        assert proc_data["input_transcript"] == "What is your name?"
        assert "JARVIS" in proc_data["response_text"]
        assert proc_data["voice_state"] == "idle"
