"""Multi-Agent System API Endpoints.

Complies with Phase 8 & PRD Section 20:
- Immutable specialized agent capabilities & tool allowlists
- Multi-agent workflow dispatch with loop protection (max_turns <= 10)
- Traceable step execution logs
- Workflow cancellation and emergency stop adherence
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.orchestrator import AgentOrchestrator, get_orchestrator
from app.database import get_db
from app.utils.logging import logger

router = APIRouter(prefix="/agents", tags=["Multi-Agent System"])


# --- Pydantic Schemas ---

class StartRunRequest(BaseModel):
    goal: str = Field(..., min_length=1, max_length=512)
    initial_agent: str = Field(default="PlanningAgent", max_length=64)
    input_payload: dict[str, Any] | None = None
    max_steps: int = Field(default=10, ge=1, le=10)


class StepRunRequest(BaseModel):
    target_agent: str | None = Field(default=None, max_length=64)
    intent: str = Field(default="progress_task", max_length=128)
    payload: dict[str, Any] | None = None


# --- Endpoints ---

@router.get("/capabilities")
def get_capabilities(
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> list[dict[str, Any]]:
    """List all registered specialized agents and their immutable allowed tools."""
    return orchestrator.get_capabilities()


@router.post("/runs", status_code=status.HTTP_201_CREATED)
def start_run(
    req: StartRunRequest,
    db: Session = Depends(get_db),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    """Start a new multi-agent orchestrated workflow run."""
    try:
        run = orchestrator.start_run(
            goal=req.goal,
            initial_agent=req.initial_agent,
            input_payload=req.input_payload,
            max_steps=req.max_steps,
            db=db,
        )
        return run.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to start agent workflow run: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/runs")
def list_runs(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> list[dict[str, Any]]:
    """List recent workflow runs."""
    runs = orchestrator.list_runs(limit=limit, db=db)
    return [r.to_dict() for r in runs]


@router.get("/runs/{run_id}")
def get_run(
    run_id: str,
    db: Session = Depends(get_db),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    """Get workflow run details including full trace log."""
    run = orchestrator.get_run(run_id, db=db)
    if not run:
        raise HTTPException(status_code=404, detail="Agent workflow run not found.")
    return run.to_dict()


@router.post("/runs/{run_id}/step")
def step_run(
    run_id: str,
    req: StepRunRequest,
    db: Session = Depends(get_db),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    """Advance the workflow run by one step."""
    try:
        run = orchestrator.step_run(
            run_id=run_id,
            target_agent=req.target_agent,
            intent=req.intent,
            custom_payload=req.payload,
            db=db,
        )
        return run.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except (RuntimeError, PermissionError) as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to step agent workflow run %s: %s", run_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/runs/{run_id}/cancel")
def cancel_run(
    run_id: str,
    db: Session = Depends(get_db),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
) -> dict[str, Any]:
    """Cancel an active agent workflow run."""
    try:
        run = orchestrator.cancel_run(run_id, db=db)
        return run.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to cancel agent workflow run %s: %s", run_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))
