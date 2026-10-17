"""Tool and Computer Operations API Endpoints.

Implements PRD Section 14 (Phase 5) and SECURITY.md Section 4 & 9:
- Tool listing and parameter schemas
- Sandboxed tool execution with result reporting
- Audit log inspection
- Emergency stop engagement and reset controls
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit import AuditLog
from app.tools.base import ToolMetadata, ToolResult
from app.tools.emergency import get_emergency_manager
from app.tools.registry import get_tool_registry

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    name: str = Field(description="Identifier of the tool to execute")
    parameters: dict[str, Any] = Field(default_factory=dict, description="Arguments for the tool")


class EmergencyStopRequest(BaseModel):
    action: str = Field(pattern="^(engage|reset)$", description="'engage' or 'reset'")
    reason: str | None = Field(default=None, description="Reason for engaging emergency stop")
    confirmed: bool = Field(default=False, description="Confirmation required to reset emergency stop")


@router.get("", response_model=list[ToolMetadata])
def list_available_tools() -> list[ToolMetadata]:
    """List all registered tools with their input parameter schemas and capabilities."""
    registry = get_tool_registry()
    return registry.list_tools()


@router.post("/execute", response_model=ToolResult)
async def execute_tool(
    payload: ToolExecuteRequest,
    db: Session = Depends(get_db),
) -> ToolResult:
    """Execute a registered tool within the security sandbox."""
    emergency = get_emergency_manager()
    if emergency.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Emergency stop is engaged: {emergency.get_status().get('reason') or 'Operations halted'}",
        )

    registry = get_tool_registry()
    result = await registry.execute_tool(payload.name, payload.parameters, db=db)

    # If the tool itself flagged that confirmation is needed before destructive action
    if result.requires_confirmation:
        return result

    # If execution failed due to security or path violation
    if not result.success and result.error and "prohibited" in result.error.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=result.error)

    return result


@router.get("/emergency-stop")
def get_emergency_stop_status() -> dict[str, Any]:
    """Get the current emergency stop status."""
    return get_emergency_manager().get_status()


@router.post("/emergency-stop")
def control_emergency_stop(payload: EmergencyStopRequest) -> dict[str, Any]:
    """Engage or reset the global emergency stop."""
    emergency = get_emergency_manager()
    if payload.action == "engage":
        reason = payload.reason or "Emergency stop engaged by user via API."
        return emergency.engage(reason=reason)
    elif payload.action == "reset":
        if not payload.confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resetting emergency stop requires explicit confirmation (confirmed=true).",
            )
        return emergency.reset(confirmed=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported action: '{payload.action}'",
        )


@router.get("/audit")
def get_tool_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Retrieve recent tool execution audit trail entries."""
    import json

    stmt = (
        select(AuditLog)
        .where(AuditLog.component == "tools")
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    res = db.execute(stmt)
    logs = res.scalars().all()

    results = []
    for log in logs:
        parsed_details: dict[str, Any] = {}
        if log.details:
            try:
                parsed_details = json.loads(log.details)
            except Exception:
                parsed_details = {"raw": log.details}
        results.append(
            {
                "id": log.id,
                "event_type": log.event_type,
                "component": log.component,
                "severity": log.severity,
                "message": log.message,
                "details": parsed_details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
        )
    return results
