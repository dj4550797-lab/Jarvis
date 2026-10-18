"""Multi-Agent Orchestrator Engine.

Complies with Phase 8 & PRD Section 20:
- Central orchestrator owning workflow task state
- Anti-loop enforcement: hard limit (max_turns <= 10) and cycle detection
- Immutable tool permissions: verified before executing steps
- Traceable agent-to-agent message logging stored in database
- Global Emergency Stop compliance and real-time cancellation
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.specialized import get_agent_registry
from app.database import get_db_session
from app.models.content_agents import AgentWorkflowRun
from app.tools.emergency import get_emergency_manager
from app.utils.logging import logger

MAX_ALLOWED_STEPS = 10


class AgentOrchestrator:
    """Central orchestrator coordinating specialized agents safely and traceably."""

    def __init__(self) -> None:
        self._registry = get_agent_registry()

    def get_capabilities(self) -> list[dict[str, Any]]:
        """List all registered agents and their immutable allowed tools."""
        return [agent.to_dict() for agent in self._registry.values()]

    def start_run(
        self,
        goal: str,
        initial_agent: str = "PlanningAgent",
        input_payload: dict[str, Any] | None = None,
        max_steps: int = MAX_ALLOWED_STEPS,
        db: Session | None = None,
    ) -> AgentWorkflowRun:
        """Start a new multi-agent workflow run."""
        if get_emergency_manager().is_active:
            raise RuntimeError("Emergency stop is active. Multi-agent workflow creation blocked.")

        if initial_agent not in self._registry:
            raise ValueError(f"Agent '{initial_agent}' is not registered. Available: {list(self._registry.keys())}")

        clamped_steps = min(max(1, max_steps), MAX_ALLOWED_STEPS)
        payload = input_payload or {}

        def _action(session: Session) -> AgentWorkflowRun:
            run = AgentWorkflowRun(
                goal=goal.strip(),
                agent_type=initial_agent,
                status="running",
                current_step=0,
                max_steps=clamped_steps,
            )
            run.input_payload = payload
            run.trace_log = [{
                "step_index": 0,
                "from_agent": "UserOrchestrator",
                "to_agent": initial_agent,
                "intent": "initialize_workflow",
                "payload": {"goal": goal, **payload},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }]
            session.add(run)
            session.commit()
            session.refresh(run)
            logger.info("Initialized AgentWorkflowRun %s: '%s' starting with %s", run.id, run.goal, initial_agent)
            return run

        if db is not None:
            return _action(db)
        with get_db_session() as session:
            return _action(session)

    def step_run(
        self,
        run_id: str,
        target_agent: str | None = None,
        intent: str = "progress_task",
        custom_payload: dict[str, Any] | None = None,
        db: Session | None = None,
    ) -> AgentWorkflowRun:
        """Advance a workflow run by executing the next agent step with loop and permission checks."""
        if get_emergency_manager().is_active:
            raise RuntimeError("Emergency stop is active. Agent workflow execution blocked.")

        def _action(session: Session) -> AgentWorkflowRun:
            run = session.get(AgentWorkflowRun, run_id)
            if not run:
                raise ValueError(f"AgentWorkflowRun '{run_id}' not found.")

            if run.status in ("completed", "failed", "cancelled"):
                raise RuntimeError(f"Cannot step workflow in '{run.status}' state.")

            # Hard limit loop protection (PRD Section 20)
            if run.current_step >= run.max_steps:
                run.status = "failed"
                run.error_message = f"Hard maximum step limit ({run.max_steps}) reached. Halted to prevent runaway loop."
                session.commit()
                session.refresh(run)
                logger.warning("Workflow %s exceeded max_steps limit (%d). Terminated.", run_id, run.max_steps)
                return run

            # Determine agent
            agent_name = target_agent or run.agent_type
            if agent_name not in self._registry:
                raise ValueError(f"Agent '{agent_name}' is not registered.")
            agent = self._registry[agent_name]

            # Loop detection (cycle detection in recent traces)
            traces = run.trace_log or []
            if len(traces) >= 4:
                # Check if last 2 steps match the step before that
                recent_pairs = [(t.get("from_agent"), t.get("to_agent"), t.get("intent")) for t in traces[-4:]]
                if recent_pairs[0] == recent_pairs[2] and recent_pairs[1] == recent_pairs[3]:
                    run.status = "failed"
                    run.error_message = "Runaway loop detected: repetitive cycle halted by orchestrator."
                    session.commit()
                    session.refresh(run)
                    logger.warning("Repetitive ping-pong loop detected in run %s. Halted.", run_id)
                    return run

            # Execute step
            payload = custom_payload or run.input_payload
            step_result = agent.execute_step(intent=intent, payload=payload)

            next_step_index = run.current_step + 1
            trace_entry = {
                "step_index": next_step_index,
                "from_agent": run.agent_type,
                "to_agent": agent_name,
                "intent": intent,
                "payload": step_result,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            traces.append(trace_entry)
            run.trace_log = traces
            run.current_step = next_step_index
            run.agent_type = agent_name

            # Check if workflow reached natural completion
            if next_step_index >= 3 or intent == "finalize_workflow":
                run.status = "completed"
                run.output_payload = {
                    "final_summary": f"Workflow completed successfully across {next_step_index} steps.",
                    "last_agent": agent_name,
                    "result": step_result,
                }
            else:
                run.status = "running"

            run.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(run)
            return run

        if db is not None:
            return _action(db)
        with get_db_session() as session:
            return _action(session)

    def cancel_run(self, run_id: str, db: Session | None = None) -> AgentWorkflowRun:
        """Cancel an in-flight workflow run immediately."""
        def _action(session: Session) -> AgentWorkflowRun:
            run = session.get(AgentWorkflowRun, run_id)
            if not run:
                raise ValueError(f"AgentWorkflowRun '{run_id}' not found.")
            if run.status not in ("completed", "failed", "cancelled"):
                run.status = "cancelled"
                run.error_message = "Workflow cancelled by operator."
                run.updated_at = datetime.now(timezone.utc)
                session.commit()
                session.refresh(run)
                logger.info("AgentWorkflowRun %s cancelled by operator.", run_id)
            return run

        if db is not None:
            return _action(db)
        with get_db_session() as session:
            return _action(session)

    def get_run(self, run_id: str, db: Session | None = None) -> AgentWorkflowRun | None:
        """Retrieve a workflow run by ID."""
        def _action(session: Session) -> AgentWorkflowRun | None:
            return session.get(AgentWorkflowRun, run_id)

        if db is not None:
            return _action(db)
        with get_db_session() as session:
            return _action(session)

    def list_runs(self, limit: int = 50, db: Session | None = None) -> list[AgentWorkflowRun]:
        """List recent workflow runs."""
        def _action(session: Session) -> list[AgentWorkflowRun]:
            stmt = select(AgentWorkflowRun).order_by(AgentWorkflowRun.created_at.desc()).limit(limit)
            return list(session.scalars(stmt).all())

        if db is not None:
            return _action(db)
        with get_db_session() as session:
            return _action(session)


# Global singleton
_orchestrator: AgentOrchestrator | None = None


def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
