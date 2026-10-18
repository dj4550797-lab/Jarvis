"""Coding Assistance API Endpoints.

Complies with Phase 7 requirements, PRD Section 17, and SECURITY.md:
- Sandboxed directory inspection and source code searching
- Python AST syntax checking with line/col diagnostics
- Structured stack trace analysis for Python and JS
- Unified diff generation, atomic patch application with pre-modification snapshots, and rollback
- Controlled test runner for approved test suites
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.coding.diagnostics import StackTraceParser
from app.coding.inspector import ProjectInspector
from app.coding.patcher import CodePatcher
from app.coding.test_runner import ControlledTestRunner
from app.database import get_db
from app.tools.emergency import get_emergency_manager
from app.tools.security import SandboxGuard, SecurityViolationError
from app.utils.logging import logger

router = APIRouter(prefix="/coding", tags=["coding"])


class DirectoryInspectRequest(BaseModel):
    directory_path: str = Field(default=r"f:\Jarvis", description="Directory to inspect within sandbox")
    max_files: int = Field(default=200, ge=1, le=1000, description="Max files to scan")


class CodeSearchRequest(BaseModel):
    directory_path: str = Field(default=r"f:\Jarvis", description="Directory to search within sandbox")
    query: str = Field(min_length=1, description="Symbol or text to search for")
    is_regex: bool = Field(default=False, description="Treat query as regular expression")
    case_sensitive: bool = Field(default=False, description="Case-sensitive matching")
    max_results: int = Field(default=50, ge=1, le=500, description="Max search results to return")


class SyntaxValidateRequest(BaseModel):
    code: str = Field(description="Python source code to parse and validate")


class StackTraceDiagnoseRequest(BaseModel):
    trace: str = Field(description="Raw Python or JS stack trace")
    workspace_root: str = Field(default=r"f:\Jarvis", description="Root workspace to map local culprit files")


class DiffRequest(BaseModel):
    original_content: str = Field(description="Original file content")
    new_content: str = Field(description="Proposed new content")
    filename: str = Field(default="file", description="Filename for diff header")


class ApplyPatchRequest(BaseModel):
    file_path: str = Field(description="Target file to modify within sandbox")
    new_content: str = Field(description="Full replacement content for the file")
    reason: str = Field(default="Code modification", description="Reason for audit tracking")


class RollbackRequest(BaseModel):
    snapshot_id: str = Field(description="Snapshot ID to restore from")


class RunTestRequest(BaseModel):
    target: str = Field(default="backend", description="Approved test target: 'backend' or 'frontend'")
    subpath: str | None = Field(default=None, description="Optional safe relative subpath (e.g. tests/test_coding.py)")
    timeout_seconds: float = Field(default=120.0, ge=1.0, le=600.0, description="Max timeout in seconds")


@router.post("/inspect")
def inspect_project(payload: DirectoryInspectRequest) -> dict[str, Any]:
    """Safely inspect project directory structure and files within sandbox boundaries."""
    try:
        return ProjectInspector.inspect_directory(
            directory_path=payload.directory_path,
            max_files=payload.max_files,
        )
    except (SecurityViolationError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to inspect directory %s: %s", payload.directory_path, exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/search")
def search_code(payload: CodeSearchRequest) -> dict[str, Any]:
    """Search for symbols and patterns line-by-line within sandbox boundaries."""
    try:
        return ProjectInspector.search_code(
            directory_path=payload.directory_path,
            query=payload.query,
            is_regex=payload.is_regex,
            case_sensitive=payload.case_sensitive,
            max_results=payload.max_results,
        )
    except (SecurityViolationError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error("Code search failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/validate-syntax")
def validate_syntax(payload: SyntaxValidateRequest) -> dict[str, Any]:
    """Parse Python source code via AST and provide precise syntax error diagnostics."""
    return ProjectInspector.validate_python_syntax(payload.code)


@router.post("/diagnose")
def diagnose_stack_trace(payload: StackTraceDiagnoseRequest) -> dict[str, Any]:
    """Parse raw Python or JavaScript/TypeScript stack trace into structured frames and diagnose."""
    return StackTraceParser.parse_and_diagnose(
        raw_trace=payload.trace,
        workspace_root=payload.workspace_root,
    )


@router.post("/diff")
def generate_diff(payload: DiffRequest) -> dict[str, Any]:
    """Generate standard unified diff between original and proposed content."""
    diff_text = CodePatcher.generate_diff(
        original=payload.original_content,
        modified=payload.new_content,
        filename=payload.filename,
    )
    return {
        "filename": payload.filename,
        "diff": diff_text,
        "has_changes": bool(diff_text.strip()),
    }


@router.post("/apply-patch")
def apply_patch(
    payload: ApplyPatchRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Atomically apply changes to a file after creating a rollback snapshot in the database."""
    emergency = get_emergency_manager()
    if emergency.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Modification halted: Emergency Stop is engaged ({emergency.get_status().get('reason') or 'Halted'})",
        )

    try:
        snapshot = CodePatcher.apply_patch(
            file_path=payload.file_path,
            new_content=payload.new_content,
            reason=payload.reason,
            db=db,
        )
        return {
            "status": "applied",
            "snapshot": snapshot.to_dict(),
        }
    except (SecurityViolationError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to apply patch to %s: %s", payload.file_path, exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/rollback")
def rollback_snapshot(
    payload: RollbackRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Restore file content from a recorded snapshot."""
    emergency = get_emergency_manager()
    if emergency.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rollback halted: Emergency Stop is engaged",
        )

    try:
        return CodePatcher.rollback_snapshot(
            snapshot_id=payload.snapshot_id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (SecurityViolationError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except Exception as exc:
        logger.error("Rollback failed for %s: %s", payload.snapshot_id, exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/snapshots")
def list_snapshots(
    file_path: str | None = Query(default=None, description="Filter by file path"),
    limit: int = Query(default=50, ge=1, le=200, description="Limit records"),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List code modification snapshot history."""
    snapshots = CodePatcher.list_snapshots(db=db, file_path=file_path, limit=limit)
    return [s.to_dict() for s in snapshots]


@router.post("/run-tests")
async def run_tests(payload: RunTestRequest) -> dict[str, Any]:
    """Execute approved test suites (pytest, vitest) under strict timeout and bounds."""
    try:
        return await ControlledTestRunner.run_approved_test(
            target=payload.target,
            subpath=payload.subpath,
            timeout_seconds=payload.timeout_seconds,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to run tests: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
