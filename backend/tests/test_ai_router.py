"""Unit Tests for AI Providers and AIRouter.

Complies with PRD Section 4.4, 4.5 and TESTING.md Section 6.
"""

from __future__ import annotations

import pytest

from app.ai.base import ChatMessage, GenerateOptions
from app.ai.mock import MockAIProvider
from app.ai.router import AIRouter


@pytest.mark.asyncio
async def test_mock_provider_generation() -> None:
    provider = MockAIProvider()
    status = await provider.check_availability()
    assert status.is_available is True
    assert "mock-echo-v1" in status.models

    messages = [ChatMessage(role="user", content="Ping")]
    result = await provider.generate(messages)
    assert "Ping" in result


@pytest.mark.asyncio
async def test_mock_provider_streaming() -> None:
    provider = MockAIProvider()
    messages = [ChatMessage(role="user", content="Test stream")]
    tokens: list[str] = []
    async for token in provider.stream(messages):
        tokens.append(token)

    assert len(tokens) > 0
    full_text = "".join(tokens)
    assert "Test stream" in full_text


@pytest.mark.asyncio
async def test_ai_router_provider_listing() -> None:
    router = AIRouter()
    statuses = await router.list_provider_statuses()
    assert len(statuses) >= 2  # mock, ollama, openai
    mock_status = next((s for s in statuses if s.provider_name == "mock"), None)
    assert mock_status is not None
    assert mock_status.is_available is True


@pytest.mark.asyncio
async def test_ai_router_fallback_to_mock_in_dev() -> None:
    router = AIRouter()
    messages = [ChatMessage(role="user", content="Fallback test")]
    # Request ollama (which is offline in test env)
    stream_gen, model_tag = await router.stream_with_fallback(
        messages,
        provider_name="ollama",
    )
    tokens: list[str] = []
    async for chunk in stream_gen:
        tokens.append(chunk)

    full_output = "".join(tokens)
    # Verifies graceful disclosure of fallback
    assert "Notice: Provider 'ollama' unavailable" in full_output
    assert "fallback:mock" in model_tag
