"""Tests for Voice STT and TTS Adapters and API Endpoints.

Complies with PRD Section 12 and PLAN.md Phase 4.
"""

from __future__ import annotations

import base64
from fastapi.testclient import TestClient
import pytest

from app.voice.stt import MockSTTAdapter, STTRouter
from app.voice.tts import MockTTSAdapter, TTSRouter


@pytest.mark.asyncio
async def test_mock_stt_adapter_direct() -> None:
    adapter = MockSTTAdapter()
    assert adapter.name == "mock"
    assert await adapter.is_available() is True

    # Empty payload defaults to recognizable test message
    res_empty = await adapter.transcribe(b"")
    assert res_empty.text == "Initiate JARVIS diagnostics and check system health."
    assert res_empty.is_final is True

    # With custom hint
    res_hint = await adapter.transcribe(b"", {"hint": "Jarvis, what is the weather?"})
    assert res_hint.text == "Jarvis, what is the weather?"


@pytest.mark.asyncio
async def test_mock_tts_adapter_direct() -> None:
    adapter = MockTTSAdapter()
    assert adapter.name == "mock"
    assert await adapter.is_available() is True

    audio_bytes, meta = await adapter.synthesize(text="Hello world", speed=1.0)
    assert meta.engine == "mock"
    assert meta.content_type == "audio/wav"
    assert meta.duration_seconds > 0
    # Must start with RIFF header
    assert audio_bytes.startswith(b"RIFF")
    assert len(audio_bytes) >= 44


def test_voice_status_endpoint(client: TestClient) -> None:
    resp = client.get("/api/v1/voice/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "stt" in data
    assert "tts" in data
    assert data["stt"]["ready"] is True
    assert data["tts"]["ready"] is True


def test_voice_transcribe_endpoint(client: TestClient) -> None:
    # 1. Default empty audio payload
    resp = client.post("/api/v1/voice/transcribe", json={"engine": "mock"})
    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert len(data["text"]) > 0
    assert data["is_final"] is True

    # 2. With base64 audio
    sample_b64 = base64.b64encode(b"RIFFdummydata").decode("utf-8")
    resp2 = client.post(
        "/api/v1/voice/transcribe",
        json={"audio_base64": sample_b64, "hint": "Run diagnostics", "engine": "mock"},
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["text"] == "Run diagnostics"

    # 3. Invalid base64 handling
    resp_bad = client.post(
        "/api/v1/voice/transcribe",
        json={"audio_base64": "!!!not_base64$$$"},
    )
    assert resp_bad.status_code == 400


def test_voice_synthesize_endpoint(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/voice/synthesize",
        json={"text": "System systems nominal.", "speed": 1.2, "engine": "mock"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    assert resp.headers["x-voice-engine"] == "mock"
    assert float(resp.headers["x-audio-duration"]) > 0
    assert resp.content.startswith(b"RIFF")
