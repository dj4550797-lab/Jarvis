"""Tests for Controlled Computer Tools (Phase 5).

Complies with PRD Section 14 and PLAN.md Phase 5.
"""

from __future__ import annotations

from pathlib import Path
from fastapi.testclient import TestClient
import pytest

from app.tools.registry import get_tool_registry
from app.tools.security import DEFAULT_WORKSPACE_ROOT, get_sandbox_guard


def test_tool_registry_initialization() -> None:
    registry = get_tool_registry()
    tools = registry.list_tools()
    tool_names = {t.name for t in tools}

    assert "file_search" in tool_names
    assert "file_read" in tool_names
    assert "file_write" in tool_names
    assert "app_launch" in tool_names
    assert "system_status" in tool_names


@pytest.mark.asyncio
async def test_file_search_tool() -> None:
    registry = get_tool_registry()
    result = await registry.execute_tool(
        "file_search",
        {"pattern": "README.md", "directory": "."},
    )
    assert result.success is True
    assert "matches" in result.output
    assert any(m["name"] == "README.md" for m in result.output["matches"])


@pytest.mark.asyncio
async def test_file_read_tool() -> None:
    registry = get_tool_registry()
    result = await registry.execute_tool(
        "file_read",
        {"path": "README.md", "max_bytes": 100000},
    )
    assert result.success is True
    assert "content" in result.output
    assert "jarvis" in result.output["content"].lower()
    assert result.output["lines_count"] > 0


@pytest.mark.asyncio
async def test_file_write_atomic_and_confirmation(tmp_path: Path) -> None:
    # Temporarily add tmp_path to sandbox guard
    guard = get_sandbox_guard()
    guard.add_approved_root(tmp_path)

    registry = get_tool_registry()
    test_file = tmp_path / "test_phase_5_write.txt"
    test_path_str = str(test_file)

    # 1. New file creation (no confirmation needed)
    res_create = await registry.execute_tool(
        "file_write",
        {"path": test_path_str, "content": "Phase 5 verified content."},
    )
    assert res_create.success is True
    assert test_file.exists()
    assert test_file.read_text(encoding="utf-8") == "Phase 5 verified content."

    # 2. Overwrite attempt without confirmation (must fail and ask confirmation)
    res_overwrite_blocked = await registry.execute_tool(
        "file_write",
        {"path": test_path_str, "content": "New overwriting content.", "confirmed": False},
    )
    assert res_overwrite_blocked.success is False
    assert res_overwrite_blocked.requires_confirmation is True
    assert "already exists" in (res_overwrite_blocked.confirmation_prompt or "")
    # Content must NOT have changed
    assert test_file.read_text(encoding="utf-8") == "Phase 5 verified content."

    # 3. Overwrite attempt with explicit confirmation
    res_overwrite_ok = await registry.execute_tool(
        "file_write",
        {"path": test_path_str, "content": "New overwriting content.", "confirmed": True},
    )
    assert res_overwrite_ok.success is True
    assert test_file.read_text(encoding="utf-8") == "New overwriting content."


@pytest.mark.asyncio
async def test_system_status_tool() -> None:
    registry = get_tool_registry()
    result = await registry.execute_tool("system_status", {})
    assert result.success is True
    assert "cpu_logical_cores" in result.output
    assert "disk_free_gb" in result.output
    assert result.output["cpu_logical_cores"] > 0


def test_tools_api_endpoints(client: TestClient) -> None:
    # 1. List tools
    resp = client.get("/api/v1/tools")
    assert resp.status_code == 200
    tools = resp.json()
    assert len(tools) >= 5
    tool_names = [t["name"] for t in tools]
    assert "file_search" in tool_names
    assert "file_read" in tool_names

    # 2. Execute tool via API
    exec_resp = client.post(
        "/api/v1/tools/execute",
        json={"name": "system_status", "parameters": {}},
    )
    assert exec_resp.status_code == 200
    res_data = exec_resp.json()
    assert res_data["success"] is True
    assert "cpu_logical_cores" in res_data["output"]

    # 3. Audit trail
    audit_resp = client.get("/api/v1/tools/audit")
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    assert isinstance(audit_logs, list)
    assert any(log["event_type"].startswith("tool_exec:") for log in audit_logs)
