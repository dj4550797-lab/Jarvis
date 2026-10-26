"""Standalone Launcher entrypoint for JARVIS Windows Executable."""

import os
import sys
import threading
import time
import webbrowser
import uvicorn
from pathlib import Path

# Adjust path if packaged inside PyInstaller bundle
if getattr(sys, "frozen", False):
    bundle_dir = Path(sys._MEIPASS)
else:
    bundle_dir = Path(__file__).resolve().parent

os.environ["JARVIS_HOST"] = "127.0.0.1"
os.environ["JARVIS_PORT"] = "8000"


def open_browser():
    """Wait for server to bind and open default browser window."""
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"\n[JARVIS] Launching Desktop Viewport at: {url}")
    try:
        webbrowser.open(url)
    except Exception as err:
        print(f"[JARVIS] Note: Could not auto-launch browser ({err}). Please open {url} manually.")


def main():
    print("=" * 60)
    print("              J A R V I S   v 0 . 1 . 0")
    print("        Autonomous Offline Personal AI Assistant")
    print("=" * 60)
    print("[+] Architecture: Local-First Tripartite (Desktop + FastIPC + SQLite)")
    print("[+] Security: Zero-Trust Enforced Local Isolation")
    print("[+] Core Server: http://127.0.0.1:8000")
    print("[+] Pages Loaded: 32 Operational Subsystems")
    print("=" * 60)
    print("Starting Central Brain... Press Ctrl+C in this terminal to stop.")

    # Start browser launcher in daemon thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Import app and start uvicorn
    from jarvis.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    main()
