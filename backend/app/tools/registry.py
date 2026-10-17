"""Central Tool Registry and Execution Coordinator.

Implements PRD Section 14 and SECURITY.md Section 4 & 9:
- Central registry of all approved tools
- Emergency stop pre-execution check
- Audit log persistence on all tool executions
- Verifiable result reporting
"""

from __future__ import annotations

import json
import time
from typing import Any

from app.database import get_session_factory
from app.models.audit import AuditLog
from app.tools.app_tools import AppLaunchTool, SystemStatusTool
from app.tools.base import BaseTool, ToolMetadata, ToolResult
from app.tools.emergency import EmergencyStopActiveError, get_emergency_manager
from app.tools.file_tools import FileReadTool, FileSearchTool, FileWriteTool
from app.utils.logging import logger


class ToolRegistry:
    """Registry coordinating discovery, security gating, and execution of tools."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        # Automatically register built-in Phase 5 controlled tools
        self.register(FileSearchTool())
        self.register(FileReadTool())
        self.register(FileWriteTool())
        self.register(AppLaunchTool())
        self.register(SystemStatusTool())

    def register(self, tool: BaseTool) -> None:
        """Register a tool instance."""
        self._tools[tool.name] = tool
        logger.debug("Registered tool: '%s' (capability: %s)", tool.name, tool.capability)

    def get_tool(self, name: str) -> BaseTool | None:
        """Lookup a registered tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[ToolMetadata]:
        """List metadata and schemas for all registered tools."""
        return [tool.to_metadata() for tool in self._tools.values()]

    async def execute_tool(
        self,
        name: str,
        params: dict[str, Any] | None = None,
        context: dict[str, Any] | None = None,
        db: Any = None,
    ) -> ToolResult:
        """Execute a tool with emergency stop check and audit logging."""
        params = params or {}
        context = context or {}

        # 1. Emergency Stop Check
        try:
            get_emergency_manager().assert_not_stopped()
        except EmergencyStopActiveError as exc:
            logger.warning("Tool execution blocked by Emergency Stop: %s", exc)
            return ToolResult(
                success=False,
                error=str(exc),
                verifiable=True,
                metadata={"emergency_stop_engaged": True},
            )

        # 2. Tool Resolution
        tool = self.get_tool(name)
        if not tool:
            return ToolResult(
                success=False,
                error=f"Tool '{name}' is not registered in the tool catalog.",
                verifiable=False,
            )

        start_time = time.perf_counter()
        result: ToolResult

        try:
            result = await tool.execute(params, context)
        except Exception as exc:
            logger.exception("Unexpected error executing tool '%s': %s", name, exc)
            result = ToolResult(
                success=False,
                error=f"Tool execution failed with exception: {exc}",
                verifiable=True,
            )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        result.metadata["execution_time_ms"] = elapsed_ms

        # 3. Persistent Audit Logging
        await self._log_audit_event(name, params, result, elapsed_ms, db=db)

        return result

    async def _log_audit_event(
        self,
        tool_name: str,
        params: dict[str, Any],
        result: ToolResult,
        elapsed_ms: float,
        db: Any = None,
    ) -> None:
        """Record tool execution audit log into database."""
        try:
            # Safe sanitization of parameters for audit log
            safe_params = dict(params)
            if "content" in safe_params and len(str(safe_params["content"])) > 200:
                safe_params["content"] = f"<truncated {len(str(safe_params['content']))} chars>"

            details_str = json.dumps({
                "tool": tool_name,
                "success": result.success,
                "requires_confirmation": result.requires_confirmation,
                "elapsed_ms": elapsed_ms,
                "params": safe_params,
                "error": result.error,
            })

            log_entry = AuditLog(
                event_type=f"tool_exec:{tool_name}",
                component="tools",
                severity="INFO" if result.success else "WARNING",
                message=f"Executed tool '{tool_name}' (success={result.success}, latency={elapsed_ms}ms)",
                details=details_str,
            )

            if db is not None:
                db.add(log_entry)
                db.commit()
            else:
                factory = get_session_factory()
                with factory() as session:
                    session.add(log_entry)
                    session.commit()
        except Exception as exc:
            logger.warning("Could not persist tool audit log: %s", exc)


_default_tool_registry = ToolRegistry()


def get_tool_registry() -> ToolRegistry:
    return _default_tool_registry
