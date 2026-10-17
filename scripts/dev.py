"""JARVIS Unified Development Runner.

Launches both the FastAPI Python backend and the React/TypeScript/Vite frontend
in development mode with graceful shutdown on Ctrl+C.
"""

import os
import signal
import subprocess
import sys
import time

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

PYTHON_EXEC = (
    os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
    if sys.platform == "win32"
    else os.path.join(ROOT_DIR, ".venv", "bin", "python")
)

if not os.path.exists(PYTHON_EXEC):
    print(f"Error: Python virtual environment not found at {PYTHON_EXEC}")
    sys.exit(1)

print("=" * 60)
print("  Starting JARVIS Personal AI Assistant (Development Mode)")
print("=" * 60)

backend_env = os.environ.copy()
backend_env["PYTHONPATH"] = BACKEND_DIR

print("[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...")
backend_proc = subprocess.Popen(
    [PYTHON_EXEC, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
    cwd=BACKEND_DIR,
    env=backend_env,
)

print("[2/2] Launching Vite Frontend on http://localhost:5173 ...")
npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
frontend_proc = subprocess.Popen(
    [npm_cmd, "run", "dev"],
    cwd=FRONTEND_DIR,
)

print("\nJARVIS Development Environment is running.")
print("Press Ctrl+C to terminate both services cleanly.\n")

def shutdown(sig, frame):
    print("\nShutting down services cleanly...")
    frontend_proc.terminate()
    backend_proc.terminate()
    try:
        frontend_proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        frontend_proc.kill()
    try:
        backend_proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        backend_proc.kill()
    print("Services stopped.")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

try:
    while True:
        time.sleep(1)
        if backend_proc.poll() is not None:
            print("Backend process exited unexpectedly.")
            break
        if frontend_proc.poll() is not None:
            print("Frontend process exited unexpectedly.")
            break
except KeyboardInterrupt:
    shutdown(None, None)
