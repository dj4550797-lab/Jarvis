"""Tests for Memory Security and Credential Exposure Prevention.

Complies with SECURITY.md Section 11.1 and PRD Section 11.3.
"""

from __future__ import annotations

import pytest

from app.memory.security import CredentialExposureError, validate_memory_content


def test_valid_memory_content_passes() -> None:
    valid_texts = [
        "User prefers Python 3.12 and FastAPI.",
        "User works on the JARVIS personal assistant project.",
        "Reminder: Submit report by Friday at 5 PM.",
        "Prefers dark mode with cyan accents.",
    ]
    for text in valid_texts:
        validate_memory_content(text)  # Should not raise


def test_empty_content_raises_value_error() -> None:
    with pytest.raises(ValueError, match="cannot be empty"):
        validate_memory_content("")

    with pytest.raises(ValueError, match="cannot be empty"):
        validate_memory_content("   \n\t  ")


def test_openai_api_key_exposure_rejected() -> None:
    leak = "My OpenAI API key is sk-1234567890abcdefghijklmnopqrstuvwxyzAB"
    with pytest.raises(CredentialExposureError, match="OpenAI / Anthropic API Key"):
        validate_memory_content(leak)


def test_github_pat_exposure_rejected() -> None:
    leak = "Token to use for repo clone: ghp_abcdefghijklmnopqrstuvwxyz1234567890"
    with pytest.raises(CredentialExposureError, match="GitHub Personal Access Token"):
        validate_memory_content(leak)


def test_aws_access_key_rejected() -> None:
    leak = "Deploy credentials: AKIAIOSFODNN7EXAMPLE"
    with pytest.raises(CredentialExposureError, match="AWS Access Key ID"):
        validate_memory_content(leak)


def test_private_key_header_rejected() -> None:
    leak = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----"
    with pytest.raises(CredentialExposureError, match="Private cryptographic key"):
        validate_memory_content(leak)


def test_plaintext_password_assignment_rejected() -> None:
    leak = "Server credentials: password = MySuperSecretPassword123!"
    with pytest.raises(CredentialExposureError, match="Plaintext password/secret assignment"):
        validate_memory_content(leak)


def test_bearer_token_rejected() -> None:
    leak = "Authorization header: Bearer abcdef1234567890abcdef1234567890"
    with pytest.raises(CredentialExposureError, match="Bearer authentication token"):
        validate_memory_content(leak)
