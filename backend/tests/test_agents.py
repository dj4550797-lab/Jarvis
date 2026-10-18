"""Tests for Multi-Agent Orchestration Engine (Phase 8).

Validates:
- Agent registry and immutable tool permission sets
- Permission enforcement (agents cannot escalate tools)
- Workflow run lifecycle (start, step, trace logs, complete)
- Hard maximum step loop prevention (max_steps <= 10)
- Repetitive cycle detection halting runaway loops
- Cancellation and Emergency Stop enforcement
- Multi-agent API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.agents.orchestrator import get_orchestrator
from app.agents.specialized import CodingAgent, ResearchAgent, get_agent_registry
from app.tools.emergency import get_emergency_manager


@pytest.fixture
def orchestrator():
    return get_orchestrator()


def test_agent_registry_immutable_permissions():
    registry = get_agent_registry()
    assert "ResearchAgent" in registry
    assert "CodingAgent" in registry
    assert "ContentAgent" in registry
    assert "DiagnosticsAgent" in registry
    assert "PlanningAgent" in registry

    research = registry["ResearchAgent"]
    assert "search_web" in research.allowed_tools
    assert "file_write" not in research.allowed_tools

    # Security check: verify that attempting to use unauthorized tool raises PermissionError
    with pytest.raises(PermissionError):
        research.assert_tool_permission("file_write")

    with pytest.raises(PermissionError):
        research.assert_tool_permission("app_launch")

    # CodingAgent permissions
    coding = registry["CodingAgent"]
    assert "coding_diff" in coding.allowed_tools
    assert "code_patch" in coding.allowed_tools
    with pytest.raises(PermissionError):
        coding.assert_tool_permission("search_web")


def test_orchestrator_run_lifecycle_and_step(orchestrator, db_session: Session):
    # Ensure emergency stop is clear
    if get_emergency_manager().is_active:
        get_emergency_manager().reset(confirmed=True)

    run = orchestrator.start_run(
        goal="Research and draft overview of Rust async ecosystem",
        initial_agent="PlanningAgent",
        max_steps=5,
        db=db_session,
    )
    assert run.id is not None
    assert run.status == "running"
    assert run.current_step == 0
    assert len(run.trace_log) == 1
    assert run.trace_log[0]["intent"] == "initialize_workflow"

    # Step 1: PlanningAgent generates breakdown
    stepped_1 = orchestrator.step_run(
        run_id=run.id,
        target_agent="PlanningAgent",
        intent="plan_decompose",
        db=db_session,
    )
    assert stepped_1.current_step == 1
    assert len(stepped_1.trace_log) == 2
    assert stepped_1.trace_log[1]["to_agent"] == "PlanningAgent"

    # Step 2: Transition to ResearchAgent
    stepped_2 = orchestrator.step_run(
        run_id=run.id,
        target_agent="ResearchAgent",
        intent="gather_facts",
        custom_payload={"query": "Tokio runtime vs async-std"},
        db=db_session,
    )
    assert stepped_2.current_step == 2
    assert stepped_2.agent_type == "ResearchAgent"

    # Step 3: Transition to ContentAgent and complete
    stepped_3 = orchestrator.step_run(
        run_id=run.id,
        target_agent="ContentAgent",
        intent="finalize_workflow",
        db=db_session,
    )
    assert stepped_3.status == "completed"
    assert stepped_3.output_payload is not None
    assert "final_summary" in stepped_3.output_payload


def test_anti_loop_hard_step_limit(orchestrator, db_session: Session):
    if get_emergency_manager().is_active:
        get_emergency_manager().reset(confirmed=True)

    run = orchestrator.start_run(
        goal="Demonstrate step limit protection",
        initial_agent="DiagnosticsAgent",
        max_steps=2,
        db=db_session,
    )
    assert run.max_steps == 2

    # Step 1
    orchestrator.step_run(run.id, target_agent="DiagnosticsAgent", intent="check_1", db=db_session)
    # Step 2
    orchestrator.step_run(run.id, target_agent="DiagnosticsAgent", intent="check_2", db=db_session)

    # Step 3 exceeds max_steps=2 -> must fail with runaway loop halt
    stepped_fail = orchestrator.step_run(run.id, target_agent="DiagnosticsAgent", intent="check_3", db=db_session)
    assert stepped_fail.status == "failed"
    assert "Hard maximum step limit" in stepped_fail.error_message


def test_anti_loop_cycle_detection(orchestrator, db_session: Session):
    if get_emergency_manager().is_active:
        get_emergency_manager().reset(confirmed=True)

    run = orchestrator.start_run(
        goal="Loop cycle detection demonstration",
        initial_agent="ResearchAgent",
        max_steps=10,
        db=db_session,
    )

    # Manually simulate a 4-step ping-pong loop in traces
    run.trace_log = [
        {"from_agent": "AgentA", "to_agent": "AgentB", "intent": "ping"},
        {"from_agent": "AgentB", "to_agent": "AgentA", "intent": "pong"},
        {"from_agent": "AgentA", "to_agent": "AgentB", "intent": "ping"},
        {"from_agent": "AgentB", "to_agent": "AgentA", "intent": "pong"},
    ]
    run.current_step = 1

    # Next step must trigger cycle detection
    halted = orchestrator.step_run(run.id, target_agent="ResearchAgent", intent="ping", db=db_session)
    assert halted.status == "failed"
    assert "repetitive cycle halted" in halted.error_message.lower()


def test_orchestrator_cancellation(orchestrator, db_session: Session):
    if get_emergency_manager().is_active:
        get_emergency_manager().reset(confirmed=True)

    run = orchestrator.start_run(
        goal="Task to be cancelled",
        initial_agent="PlanningAgent",
        db=db_session,
    )
    assert run.status == "running"

    cancelled = orchestrator.cancel_run(run.id, db=db_session)
    assert cancelled.status == "cancelled"
    assert "cancelled by operator" in cancelled.error_message.lower()

    # Stepping cancelled run raises RuntimeError
    with pytest.raises(RuntimeError):
        orchestrator.step_run(run.id, db=db_session)


def test_emergency_stop_blocks_agent_orchestration(orchestrator, db_session: Session):
    emergency = get_emergency_manager()
    try:
        emergency.engage("Testing emergency stop block")
        with pytest.raises(RuntimeError, match="Emergency stop is active"):
            orchestrator.start_run("Should be blocked", initial_agent="PlanningAgent", db=db_session)
    finally:
        emergency.reset(confirmed=True)


def test_agent_api_endpoints(client: TestClient):
    if get_emergency_manager().is_active:
        get_emergency_manager().reset(confirmed=True)

    # 1. Capabilities
    res_caps = client.get("/api/v1/agents/capabilities")
    assert res_caps.status_code == 200
    caps = res_caps.json()
    assert len(caps) >= 5
    agent_names = [a["name"] for a in caps]
    assert "ResearchAgent" in agent_names
    assert "CodingAgent" in agent_names

    # 2. Start run
    res_start = client.post("/api/v1/agents/runs", json={
        "goal": "Test API Run",
        "initial_agent": "PlanningAgent",
        "max_steps": 5,
    })
    assert res_start.status_code == 201
    run_data = res_start.json()
    run_id = run_data["id"]
    assert run_data["status"] == "running"

    # 3. List runs
    res_list = client.get("/api/v1/agents/runs")
    assert res_list.status_code == 200
    assert any(r["id"] == run_id for r in res_list.json())

    # 4. Get run
    res_get = client.get(f"/api/v1/agents/runs/{run_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == run_id

    # 5. Step run
    res_step = client.post(f"/api/v1/agents/runs/{run_id}/step", json={
        "target_agent": "DiagnosticsAgent",
        "intent": "system_check",
    })
    assert res_step.status_code == 200
    assert res_step.json()["current_step"] == 1

    # 6. Cancel run
    res_cancel = client.post(f"/api/v1/agents/runs/{run_id}/cancel")
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"
