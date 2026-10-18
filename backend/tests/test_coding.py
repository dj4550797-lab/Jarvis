"""Tests for Coding Assistance Subsystem (Phase 7).

Complies with PRD Section 17, PLAN.md Section 11, and SECURITY.md:
- Project directory inspection and sandbox boundaries
- Python AST syntax checking
- Symbol and regex search
- Stack trace diagnosis (Python and JavaScript)
- Unified diff generation, pre-patch snapshots, and one-click rollback
- Controlled test execution and emergency stop protection
- REST API endpoint verification
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.coding.diagnostics import StackTraceParser
from app.coding.inspector import ProjectInspector
from app.coding.patcher import CodePatcher
from app.coding.test_runner import ControlledTestRunner
from app.models.coding_research import CodeSnapshot
from app.tools.emergency import get_emergency_manager
from app.tools.security import SecurityViolationError


# --- Unit Tests: ProjectInspector ---

def test_inspector_inspect_valid_directory() -> None:
    result = ProjectInspector.inspect_directory(directory_path=r"f:\Jarvis\backend\app\coding", max_files=10)
    assert "root_path" in result
    assert result["total_files_scanned"] > 0
    assert len(result["files"]) <= 10
    file_names = [f["name"] for f in result["files"]]
    assert "inspector.py" in file_names


def test_inspector_blocks_outside_directory() -> None:
    with pytest.raises(SecurityViolationError):
        ProjectInspector.inspect_directory(directory_path="C:\\Windows\\System32")


def test_inspector_validate_syntax_valid() -> None:
    code = "def add(a: int, b: int) -> int:\n    return a + b\n"
    res = ProjectInspector.validate_python_syntax(code)
    assert res["valid"] is True
    assert len(res["errors"]) == 0


def test_inspector_validate_syntax_invalid() -> None:
    code = "def bad_syntax(:\n    pass\n"
    res = ProjectInspector.validate_python_syntax(code)
    assert res["valid"] is False
    assert len(res["errors"]) == 1
    err = res["errors"][0]
    assert err["line"] == 1
    assert "SyntaxError" in res["message"]


def test_inspector_search_code() -> None:
    result = ProjectInspector.search_code(
        directory_path=r"f:\Jarvis\backend\app\coding",
        query="ProjectInspector",
        is_regex=False,
    )
    assert result["total_matches"] > 0
    assert any("ProjectInspector" in m["line_content"] for m in result["matches"])


def test_inspector_search_code_regex() -> None:
    result = ProjectInspector.search_code(
        directory_path=r"f:\Jarvis\backend\app\coding",
        query=r"def\s+inspect_directory",
        is_regex=True,
    )
    assert result["total_matches"] >= 1


def test_inspector_search_invalid_regex() -> None:
    with pytest.raises(ValueError, match="Invalid regex pattern"):
        ProjectInspector.search_code(
            directory_path=r"f:\Jarvis\backend\app\coding",
            query="[unclosed-regex",
            is_regex=True,
        )


# --- Unit Tests: StackTraceParser ---

def test_diagnostics_parse_python_trace() -> None:
    sample_trace = """Traceback (most recent call last):
  File "f:\\Jarvis\\backend\\app\\coding\\inspector.py", line 42, in inspect_directory
    raise ValueError("Directory cannot be empty")
ValueError: Directory cannot be empty
"""
    diag = StackTraceParser.parse_and_diagnose(sample_trace, workspace_root=r"f:\Jarvis")
    assert diag["detected_language"] == "python"
    assert diag["error_type"] == "ValueError"
    assert "Directory cannot be empty" in diag["error_message"]
    assert len(diag["frames"]) >= 1
    frame = diag["frames"][0]
    assert "inspector.py" in frame["file"]
    assert frame["line"] == 42
    assert frame["is_local_project_file"] is True
    assert diag["analysis"]["primary_culprit"] is not None


def test_diagnostics_parse_js_trace() -> None:
    sample_js_trace = """TypeError: Cannot read properties of undefined (reading 'map')
    at renderItems (f:/Jarvis/frontend/src/features/coding/CodingView.tsx:45:18)
    at App (f:/Jarvis/frontend/src/App.tsx:28:10)
"""
    diag = StackTraceParser.parse_and_diagnose(sample_js_trace, workspace_root=r"f:\Jarvis")
    assert diag["detected_language"] in ("javascript", "typescript")
    assert diag["error_type"] == "TypeError"
    assert "Cannot read properties of undefined" in diag["error_message"]
    assert len(diag["frames"]) == 2
    assert diag["frames"][0]["function"] == "renderItems"
    assert diag["frames"][0]["is_local_project_file"] is True


def test_diagnostics_empty_trace() -> None:
    diag = StackTraceParser.parse_and_diagnose("")
    assert diag["detected_language"] == "unknown"
    assert diag["frames"] == []


# --- Unit Tests: CodePatcher & Rollback ---

def test_code_patcher_diff_generation() -> None:
    original = "line 1\nline 2\nline 3\n"
    modified = "line 1\nline 2 modified\nline 3\nline 4\n"
    diff = CodePatcher.generate_diff(original, modified, filename="test.py")
    assert "--- a/test.py" in diff
    assert "+++ b/test.py" in diff
    assert "-line 2" in diff
    assert "+line 2 modified" in diff
    assert "+line 4" in diff


def test_code_patcher_apply_and_rollback(db_session: Session) -> None:
    test_file = Path(r"f:\Jarvis\backend\app\coding\_temp_test_patch.py")
    original_code = "print('original version')\n"
    new_code = "print('patched version')\n"

    try:
        # Create initial file
        with open(test_file, "w", encoding="utf-8") as fp:
            fp.write(original_code)

        # Apply patch
        snapshot = CodePatcher.apply_patch(
            file_path=str(test_file),
            new_content=new_code,
            reason="Test automated patch",
            db=db_session,
        )

        assert snapshot.id is not None
        assert snapshot.restored is False
        assert os.path.exists(test_file)

        # Verify on-disk content changed
        with open(test_file, "r", encoding="utf-8") as fp:
            assert fp.read() == new_code

        # List snapshots
        snapshots = CodePatcher.list_snapshots(db=db_session, file_path=str(test_file))
        assert len(snapshots) >= 1
        assert snapshots[0].id == snapshot.id

        # Rollback
        rollback_res = CodePatcher.rollback_snapshot(snapshot_id=snapshot.id, db=db_session)
        assert rollback_res["status"] == "restored"

        # Verify on-disk content restored
        with open(test_file, "r", encoding="utf-8") as fp:
            assert fp.read() == original_code

        # Verify snapshot restored state in DB
        db_session.refresh(snapshot)
        assert snapshot.restored is True
        assert snapshot.restored_at is not None

    finally:
        if test_file.exists():
            test_file.unlink()


def test_code_patcher_rejects_outside_path(db_session: Session) -> None:
    with pytest.raises(SecurityViolationError):
        CodePatcher.apply_patch(
            file_path="C:\\Windows\\System32\\test.py",
            new_content="evil",
            reason="Unauthorized access",
            db=db_session,
        )


# --- Unit Tests: ControlledTestRunner ---

@pytest.mark.asyncio
async def test_test_runner_rejects_unknown_target() -> None:
    with pytest.raises(ValueError, match="Unsupported test target"):
        await ControlledTestRunner.run_approved_test(target="malicious_target")


@pytest.mark.asyncio
async def test_test_runner_emergency_stop_blocks() -> None:
    emergency = get_emergency_manager()
    emergency.engage(reason="Test emergency stop")
    try:
        with pytest.raises(RuntimeError, match="Emergency Stop is engaged"):
            await ControlledTestRunner.run_approved_test(target="backend")
    finally:
        emergency.reset(confirmed=True)


# --- API Endpoint Integration Tests ---

def test_api_coding_inspect(client: TestClient) -> None:
    response = client.post(
        "/api/v1/coding/inspect",
        json={"directory_path": r"f:\Jarvis\backend\app\coding", "max_files": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_files_scanned" in data
    assert len(data["files"]) <= 5


def test_api_coding_inspect_forbidden(client: TestClient) -> None:
    response = client.post(
        "/api/v1/coding/inspect",
        json={"directory_path": "C:\\Windows\\System32"},
    )
    assert response.status_code == 403


def test_api_coding_search(client: TestClient) -> None:
    response = client.post(
        "/api/v1/coding/search",
        json={
            "directory_path": r"f:\Jarvis\backend\app\coding",
            "query": "ProjectInspector",
            "is_regex": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] > 0


def test_api_coding_validate_syntax(client: TestClient) -> None:
    # Valid
    res_valid = client.post(
        "/api/v1/coding/validate-syntax",
        json={"code": "x = 42\ny = x * 2\n"},
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["valid"] is True

    # Invalid
    res_invalid = client.post(
        "/api/v1/coding/validate-syntax",
        json={"code": "def foo(\n"},
    )
    assert res_invalid.status_code == 200
    assert res_invalid.json()["valid"] is False
    assert len(res_invalid.json()["errors"]) > 0


def test_api_coding_diagnose(client: TestClient) -> None:
    response = client.post(
        "/api/v1/coding/diagnose",
        json={
            "trace": "ZeroDivisionError: division by zero",
            "workspace_root": r"f:\Jarvis",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error_type"] == "ZeroDivisionError"


def test_api_coding_diff(client: TestClient) -> None:
    response = client.post(
        "/api/v1/coding/diff",
        json={
            "original_content": "val = 1\n",
            "new_content": "val = 2\n",
            "filename": "sample.py",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_changes"] is True
    assert "+val = 2" in data["diff"]


def test_api_coding_patch_and_rollback_flow(client: TestClient) -> None:
    test_file = Path(r"f:\Jarvis\backend\app\coding\_temp_api_test.py")
    orig_content = "def test_func(): return True\n"
    new_content = "def test_func(): return False\n"

    try:
        with open(test_file, "w", encoding="utf-8") as fp:
            fp.write(orig_content)

        # Apply patch via API
        apply_res = client.post(
            "/api/v1/coding/apply-patch",
            json={
                "file_path": str(test_file),
                "new_content": new_content,
                "reason": "API test patch",
            },
        )
        assert apply_res.status_code == 200
        snap_id = apply_res.json()["snapshot"]["id"]

        # List snapshots via API
        list_res = client.get(f"/api/v1/coding/snapshots?file_path={test_file}")
        assert list_res.status_code == 200
        snapshots = list_res.json()
        assert any(s["id"] == snap_id for s in snapshots)

        # Rollback via API
        rollback_res = client.post(
            "/api/v1/coding/rollback",
            json={"snapshot_id": snap_id},
        )
        assert rollback_res.status_code == 200
        assert rollback_res.json()["status"] == "restored"

        # Verify restored content
        with open(test_file, "r", encoding="utf-8") as fp:
            assert fp.read() == orig_content

    finally:
        if test_file.exists():
            test_file.unlink()


def test_api_coding_emergency_stop_blocks_patch(client: TestClient) -> None:
    emergency = get_emergency_manager()
    emergency.engage(reason="Safety test")
    try:
        response = client.post(
            "/api/v1/coding/apply-patch",
            json={
                "file_path": r"f:\Jarvis\backend\app\coding\inspector.py",
                "new_content": "# blocked",
                "reason": "Should be halted",
            },
        )
        assert response.status_code == 409
        assert "Emergency Stop is engaged" in response.json()["detail"]
    finally:
        emergency.reset(confirmed=True)
