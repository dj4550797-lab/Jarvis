"""Application Launcher and System Status Tools for JARVIS.

Implements PRD Section 14 and SECURITY.md Section 9:
- Approved application launching against explicit allowlist
- Zero arbitrary shell execution (shell=False strictly enforced)
- Host resource and process telemetry inspection
"""

from __future__ import annotations

import os
import shutil
import subprocess
from typing import Any

from app.tools.base import BaseTool, ToolResult
from app.tools.security import ALLOWED_APPLICATIONS, get_sandbox_guard
from app.utils.logging import logger


class AppLaunchTool(BaseTool):
    """Launch an approved application from the vetted allowlist."""

    name = "app_launch"
    description = (
        "Launch an approved desktop application from the whitelist: "
        f"{', '.join(sorted(ALLOWED_APPLICATIONS))}. Arbitrary shell commands are blocked."
    )
    capability = "process.launch"
    requires_confirmation = False

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "required": ["application"],
            "properties": {
                "application": {
                    "type": "string",
                    "description": f"Name of application to launch (one of {sorted(ALLOWED_APPLICATIONS)}).",
                },
                "arguments": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional command-line arguments to pass to the application.",
                    "default": [],
                },
            },
        }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        app_name = params.get("application")
        if not app_name:
            return ToolResult(success=False, error="Parameter 'application' is required.", verifiable=False)

        raw_args = params.get("arguments", [])
        if not isinstance(raw_args, list):
            raw_args = []

        guard = get_sandbox_guard()
        try:
            clean_app = guard.validate_application_launch(app_name, raw_args)
        except Exception as exc:
            return ToolResult(success=False, error=str(exc), verifiable=True)

        try:
            # Strictly use shell=False with argument array to prevent command injection
            cmd = [clean_app] + [str(a) for a in raw_args]
            logger.info("Executing approved application launch: %s", cmd)
            proc = subprocess.Popen(
                cmd,
                shell=False,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return ToolResult(
                success=True,
                output={
                    "application": clean_app,
                    "pid": proc.pid,
                    "status": "launched",
                },
                verifiable=True,
            )
        except Exception as exc:
            return ToolResult(
                success=False,
                error=f"Failed to launch application '{clean_app}': {exc}",
                verifiable=True,
            )


class SystemStatusTool(BaseTool):
    """Query host system resources and hardware utilization safely."""

    name = "system_status"
    description = "Inspect real-time system metrics: CPU, RAM, and disk utilization."
    capability = "system.control"
    requires_confirmation = False

    def get_parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
        }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> ToolResult:
        try:
            import psutil

            cpu_count = psutil.cpu_count(logical=True)
            cpu_percent = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("C:\\" if os.name == "nt" else "/")

            return ToolResult(
                success=True,
                output={
                    "cpu_logical_cores": cpu_count,
                    "cpu_percent": cpu_percent,
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "ram_available_gb": round(mem.available / (1024**3), 2),
                    "ram_percent": mem.percent,
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "disk_free_gb": round(disk.free / (1024**3), 2),
                    "disk_percent": disk.percent,
                },
                verifiable=True,
            )
        except ImportError:
            # Fallback if psutil is unavailable
            disk_info = shutil.disk_usage("C:\\" if os.name == "nt" else "/")
            return ToolResult(
                success=True,
                output={
                    "cpu_logical_cores": os.cpu_count() or 1,
                    "disk_total_gb": round(disk_info.total / (1024**3), 2),
                    "disk_free_gb": round(disk_info.free / (1024**3), 2),
                },
                verifiable=True,
            )
        except Exception as exc:
            return ToolResult(
                success=False,
                error=f"Failed to collect system status: {exc}",
                verifiable=True,
            )
