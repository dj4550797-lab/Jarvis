"""Memory Privacy and Credential Protection Filters.

Enforces SECURITY.md Section 11.1 and PRD Section 11.3:
- Absolute prohibition against storing passwords, API keys, private keys, or bearer tokens
- Validation before database insertion or update
"""

from __future__ import annotations

import re


class CredentialExposureError(ValueError):
    """Raised when memory content contains suspected credentials or sensitive secrets."""
    pass


# Regular expressions targeting common secret and credential signatures
SECRET_PATTERNS = [
    (re.compile(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----", re.IGNORECASE), "Private cryptographic key"),
    (re.compile(r"\b(?:sk-[a-zA-Z0-9_-]{20,})\b"), "OpenAI / Anthropic API Key"),
    (re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b"), "GitHub Personal Access Token"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "AWS Access Key ID"),
    (re.compile(r"\bAIzaSy[a-zA-Z0-9_-]{33}\b"), "Google Cloud API Key"),
    (re.compile(r"\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b"), "JSON Web Token (JWT)"),
    (re.compile(r"(?:password|passwd|pwd|secret)\s*[:=]\s*['\"]?[^\s'\"]{6,}['\"]?", re.IGNORECASE), "Plaintext password/secret assignment"),
    (re.compile(r"\b(?:bearer\s+[a-zA-Z0-9_\-\.]{24,})\b", re.IGNORECASE), "Bearer authentication token"),
]


def validate_memory_content(content: str) -> None:
    """Validate that text content does not contain exposed credentials.
    
    Raises:
        CredentialExposureError: If a secret pattern is detected.
    """
    if not content or not content.strip():
        raise ValueError("Memory content cannot be empty.")

    for pattern, description in SECRET_PATTERNS:
        if pattern.search(content):
            raise CredentialExposureError(
                f"Security policy violation (SECURITY.md 11.1): Memory contains suspected credentials ({description}). Storing authentication secrets in ordinary memory is strictly prohibited."
            )
