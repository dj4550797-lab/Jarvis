"""Unit Tests for Configuration and Environment Validation.

Complies with CONFIGURATION.md and TESTING.md Section 5.1.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_valid_default_settings() -> None:
    settings = Settings(env="development", port=8000, host="127.0.0.1")
    assert settings.env == "development"
    assert settings.port == 8000
    assert settings.host == "127.0.0.1"
    assert settings.ai_provider == "mock"


def test_reject_invalid_environment() -> None:
    with pytest.raises(ValidationError):
        Settings(env="staging")  # type: ignore[arg-type]


def test_reject_invalid_port() -> None:
    with pytest.raises(ValidationError):
        Settings(port=80)  # Privileged port < 1024


def test_reject_public_host_binding() -> None:
    with pytest.raises(ValidationError):
        Settings(host="0.0.0.0")  # Reject non-loopback


def test_secrets_redaction() -> None:
    settings = Settings(
        openai_api_key="sk-realsecret12345678901234567890",
        anthropic_api_key="sk-ant-realtoken1234567890123456",
    )
    safe = settings.safe_dict()
    assert safe["openai_api_key"] == "[REDACTED]"
    assert safe["anthropic_api_key"] == "[REDACTED]"
    assert "sk-realsecret" not in str(safe)
