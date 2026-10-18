"""Controlled Project Test Runner.

Complies with Phase 7 requirements, PRD Section 17, and SECURITY.md:
- Strict allowlist of approved test runner commands
- Spawns subprocesses with shell=False
- Bounded execution with timeout enforcement
- Truthful reporting of exit codes, execution times, and stdout/stderr outputs
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from typing import Any

from app.tools.emergency import get_emergency_manager
from app.tools.security import SandboxGuard
from app.utils.logging import logger

ALLOWED_TEST_TARGETS = {
    "backend": {
        "command": [sys.executable, "-m", "pytest"],
        "cwd_rel": "backend",
        "description": "Python backend pytest test suite",
    },
    "frontend": {
        "command": ["npm.cmd" if os.name == "nt" else "npm", "test", "--", "--run"],
        "cwd_rel": "frontend",
        "description": "React frontend Vitest test suite",
    },
}


class ControlledTestRunner:
    """Executes authorized project test suites and captures verified outcomes."""

    @classmethod
    async def run_approved_test(
        cls,
        target: str = "backend",
        subpath: str | None = None,
        timeout_seconds: float = 120.0,
        workspace_root: str = r"f:\Jarvis",
    ) -> dict[str, Any]:
        """Execute an approved test command asynchronously within project bounds."""
        emergency = get_emergency_manager()
        if emergency.is_active:
            raise RuntimeError("Test execution blocked: Emergency Stop is engaged")

        if target not in ALLOWED_TEST_TARGETS:
            raise ValueError(
                f"Unsupported test target '{target}'. Allowed targets: {list(ALLOWED_TEST_TARGETS.keys())}"
            )

        resolved_root = SandboxGuard.validate_path(workspace_root)
        config = ALLOWED_TEST_TARGETS[target]
        cwd = os.path.join(resolved_root, config["cwd_rel"])

        cmd = list(config["command"])
        if subpath:
            # Prevent command injection through subpath
            safe_sub = re_clean_subpath(subpath)
            cmd.append(safe_sub)

        logger.info("Executing approved test target '%s': %s (cwd=%s)", target, cmd, cwd)

        start_time = time.perf_counter()
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                creationflags=getattr(asyncio.subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0,
            )

            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout_seconds,
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)

            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            exit_code = proc.returncode or 0

            passed = (exit_code == 0)

            return {
                "target": target,
                "command": " ".join(cmd),
                "cwd": cwd,
                "passed": passed,
                "exit_code": exit_code,
                "elapsed_ms": elapsed_ms,
                "stdout": stdout,
                "stderr": stderr,
                "summary": (
                    f"Test run {'PASSED' if passed else 'FAILED'} with exit code {exit_code} in {elapsed_ms}ms"
                ),
            }

        except asyncio.TimeoutError:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
            try:
                proc.kill()
            except Exception:
                pass
            return {
                "target": target,
                "command": " ".join(cmd),
                "cwd": cwd,
                "passed": False,
                "exit_code": -1,
                "elapsed_ms": elapsed_ms,
                "stdout": "",
                "stderr": f"Test run timed out after {timeout_seconds} seconds.",
                "summary": f"Test run TIMED OUT after {timeout_seconds}s.",
            }

        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
            logger.error("Failed to run tests: %s", exc)
            return {
                "target": target,
                "command": " ".join(cmd),
                "cwd": cwd,
                "passed": False,
                "exit_code": 1,
                "elapsed_ms": elapsed_ms,
                "stdout": "",
                "stderr": str(exc),
                "summary": f"Failed to launch test process: {exc}",
            }


def re_clean_subpath(sub: str) -> str:
    """Sanitize relative subpath argument for test runner."""
    clean = sub.strip().replace("..", "").replace(";", "").replace("&", "").replace("|", "")
    return clean
