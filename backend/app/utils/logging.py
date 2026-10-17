"""JARVIS Centralized Logging with Secret Redaction.

Complies with SECURITY.md and CONFIGURATION.md by preventing API keys,
passwords, and credentials from leaking into log files or console streams.
"""

from __future__ import annotations

import logging
import re
import sys
from pathlib import Path
from typing import ClassVar

from app.config import get_settings

# Patterns to detect common tokens, keys, and credentials
REDACT_PATTERNS = [
    re.compile(r"(sk-[a-zA-Z0-9_-]{20,})", re.IGNORECASE),
    re.compile(r"(ghp_[a-zA-Z0-9]{30,})", re.IGNORECASE),
    re.compile(r"(key-[a-zA-Z0-9_-]{20,})", re.IGNORECASE),
    re.compile(r"(['\"]?(?:password|token|api_key|secret)['\"]?\s*[:=]\s*['\"])([^'\"]+)(['\"])", re.IGNORECASE),
    re.compile(r"(Bearer\s+)[a-zA-Z0-9_.-]+", re.IGNORECASE),
]


class RedactingFormatter(logging.Formatter):
    """Logging formatter that redacts secrets matching known patterns."""

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        for pattern in REDACT_PATTERNS:
            if pattern.groups == 1:
                msg = pattern.sub("[REDACTED]", msg)
            elif pattern.groups == 3:
                msg = pattern.sub(r"\1[REDACTED]\3", msg)
        return msg


def setup_logging() -> logging.Logger:
    """Initialize centralized logging for JARVIS."""
    settings = get_settings()
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    root_logger = logging.getLogger("jarvis")
    root_logger.setLevel(log_level)

    # Avoid adding duplicate handlers if already configured
    if root_logger.handlers:
        return root_logger

    formatter = RedactingFormatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File Handler in application data directory
    try:
        log_dir = settings.resolve_data_dir() / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "jarvis.log", encoding="utf-8")
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    except Exception as exc:
        # Fall back gracefully without crashing startup
        root_logger.warning("Could not initialize file log handler: %s", exc)

    return root_logger


logger = setup_logging()
