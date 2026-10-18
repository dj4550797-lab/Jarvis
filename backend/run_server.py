"""JARVIS Production Server Entrypoint.

Starts the standalone packaged JARVIS FastAPI backend and embedded UI.
"""

from __future__ import annotations

import os
import sys

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import uvicorn
from app.config import get_settings
from app.main import app

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
        access_log=False,
    )
