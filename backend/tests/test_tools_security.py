"""Security and Sandbox Boundary Tests for Tools (Phase 5).

Complies with SECURITY.md Section 4, 9, 11 and PRD Section 14:
- Path traversal defense
- Reserved Windows device names
- Application whitelist enforcement
- Shell metacharacter injection blocking
- Emergency stop gating
"""

from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from app.tools.emergency import get_emergency_manager
from app.tools.registry import get_tool_registry
from app.tools.security import SecurityViolationError, get_sandbox_guard


@pytest.mark.parametrize(
    "traversal_path",
    [
        "../../Windows/System32/calc.exe",
        "../..",
        "/etc/passwd",
        "C:\\Windows\\System32\\cmd.exe",
        "\\\\192.168.1.10\\share\\file.txt",
        "\\\\?\\C:\\Windows",
        "CON",
        "NUL",
        "PRN",
        "COM1",
    ],
)
def test_sandbox_blocks_path_traversal_and_device_names(traversal_path: str) -> None:
    guard = get_sandbox_guard()
    with pytest.raises(SecurityViolationError):
        guard.validate_path(traversal_path)


@pytest.mark.asyncio
async def test_file_read_blocks_path_traversal() -> None:
    registry = get_tool_registry()
    result = await registry.execute_tool(
        "file_read",
        {"path": "../../Windows/win.ini"},
    )
    assert result.success is False
    assert "Path traversal denied" in (result.error or "")


@pytest.mark.asyncio
async def test_file_write_blocks_path_traversal() -> None:
    registry = get_tool_registry()
    result = await registry.execute_tool(
        "file_write",
        {"path": "C:\\Windows\\System32\\malicious.bat", "content": "echo hacked"},
    )
    assert result.success is False
    assert "Path traversal denied" in (result.error or "")


def test_app_launch_blocks_non_allowlisted_apps() -> None:
    guard = get_sandbox_guard()
    # Unapproved binaries
    for bad_app in ["powershell.exe", "cmd.exe", "bash", "curl", "python.exe"]:
        with pytest.raises(SecurityViolationError) as exc_info:
            guard.validate_application_launch(bad_app)
        assert "not in the approved application allowlist" in str(exc_info.value)


def test_app_launch_blocks_shell_metacharacters() -> None:
    guard = get_sandbox_guard()
    dangerous_args = [
        ["&", "dir"],
        ["|", "calc.exe"],
        [";", "rmdir"],
        [">", "out.txt"],
        ["`", "id"],
        ["\ncalc"],
    ]
    for args in dangerous_args:
        with pytest.raises(SecurityViolationError) as exc_info:
            guard.validate_application_launch("notepad.exe", args)
        assert "forbidden" in str(exc_info.value).lower()


def test_emergency_stop_lifecycle_and_api(client: TestClient) -> None:
    emergency = get_emergency_manager()
    # Ensure starting in non-active state
    if emergency.is_active:
        emergency.reset(confirmed=True)

    # 1. Engage Emergency Stop via API
    resp_engage = client.post(
        "/api/v1/tools/emergency-stop",
        json={"action": "engage", "reason": "Operator triggered safety shutdown"},
    )
    assert resp_engage.status_code == 200
    assert resp_engage.json()["is_active"] is True

    # 2. Status verification
    resp_status = client.get("/api/v1/tools/emergency-stop")
    assert resp_status.status_code == 200
    assert resp_status.json()["is_active"] is True
    assert "safety shutdown" in resp_status.json()["reason"]

    # 3. Execution of any tool must be blocked with 409 Conflict
    resp_exec_blocked = client.post(
        "/api/v1/tools/execute",
        json={"name": "system_status", "parameters": {}},
    )
    assert resp_exec_blocked.status_code == 409
    assert "Emergency stop is engaged" in resp_exec_blocked.json()["detail"]

    # 4. Reset without confirmation must be rejected (400 Bad Request)
    resp_reset_bad = client.post(
        "/api/v1/tools/emergency-stop",
        json={"action": "reset", "confirmed": False},
    )
    assert resp_reset_bad.status_code == 400

    # 5. Reset with explicit confirmation must succeed
    resp_reset_ok = client.post(
        "/api/v1/tools/emergency-stop",
        json={"action": "reset", "confirmed": True},
    )
    assert resp_reset_ok.status_code == 200
    assert resp_reset_ok.json()["is_active"] is False

    # 6. Operations resume normally
    resp_exec_resumed = client.post(
        "/api/v1/tools/execute",
        json={"name": "system_status", "parameters": {}},
    )
    assert resp_exec_resumed.status_code == 200
    assert resp_exec_resumed.json()["success"] is True
