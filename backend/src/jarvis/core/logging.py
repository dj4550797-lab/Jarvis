"""Structured Application Logging with Sensitive Data Redaction."""

import logging
import re
import sys
from pathlib import Path
from jarvis.core.config import settings

SENSITIVE_PATTERNS = [
    re.compile(r"(sk-[a-zA-Z0-9_-]{20,})"),  # OpenAI keys
    re.compile(r"(ghp_[a-zA-Z0-9]{36,})"),   # GitHub tokens
    re.compile(r"(Bearer\s+[a-zA-Z0-9._-]+)"), # Bearer tokens
    re.compile(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"), # Email addresses
]


class RedactingFormatter(logging.Formatter):
    """Log formatter that automatically masks credentials and sensitive tokens."""

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = original
        for pattern in SENSITIVE_PATTERNS:
            redacted = pattern.sub("[REDACTED]", redacted)
        return redacted


def setup_logging() -> logging.Logger:
    """Initialize structured console and file logging."""
    logger = logging.getLogger("jarvis")
    logger.setLevel(getattr(logging, settings.JARVIS_LOG_LEVEL.upper(), logging.INFO))

    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_fmt = RedactingFormatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(console_fmt)
        logger.addHandler(console_handler)

        # File Handler
        log_dir = Path("logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "jarvis.log", encoding="utf-8")
        file_fmt = RedactingFormatter(
            "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(file_fmt)
        logger.addHandler(file_handler)

    return logger


logger = setup_logging()
