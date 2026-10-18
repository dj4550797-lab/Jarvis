import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentsView } from "./AgentsView";

const mockCapabilities = [
  {
    name: "PlanningAgent",
    role: "Goal decomposition and agent coordination",
    system_prompt: "You are the JARVIS Master Task Planning Specialist.",
    allowed_tools: ["plan_decompose", "assign_subtask", "verify_completion"],
  },
  {
    name: "ResearchAgent",
    role: "Information synthesis and fact verification",
    system_prompt: "You are the JARVIS Research Specialist.",
    allowed_tools: ["search_web", "read_source", "extract_citations"],
  },
  {
    name: "CodingAgent",
    role: "Code analysis and syntax verification",
    system_prompt: "You are the JARVIS Software Engineering Specialist.",
    allowed_tools: ["coding_diff", "code_patch", "code_rollback", "ast_validate"],
  },
  {
    name: "ContentAgent",
    role: "Scriptwriting and prompt generation",
    system_prompt: "You are the JARVIS Content Production Specialist.",
    allowed_tools: ["generate_script", "breakdown_scenes", "build_prompts", "export_package"],
  },
  {
    name: "DiagnosticsAgent",
    role: "System health verification and hardware diagnostics",
    system_prompt: "You are the JARVIS System Diagnostics Specialist.",
    allowed_tools: ["check_health", "verify_devices", "inspect_logs", "audit_diagnostics"],
  },
];

const mockRuns = [
  {
    id: "run-001",
    goal: "Plan and synthesize telemetry analysis",
    agent_type: "PlanningAgent",
    status: "running",
    current_step: 1,
    max_steps: 5,
    input_payload: { goal: "Plan and synthesize telemetry analysis" },
    output_payload: null,
    trace_log: [
      {
        step_index: 0,
        from_agent: "UserOrchestrator",
        to_agent: "PlanningAgent",
        intent: "initialize_workflow",
        payload: { goal: "Plan and synthesize telemetry analysis" },
        timestamp: new Date().toISOString(),
      },
      {
        step_index: 1,
        from_agent: "PlanningAgent",
        to_agent: "ResearchAgent",
        intent: "plan_decompose",
        payload: { subtasks: ["Gather facts", "Audit code"] },
        timestamp: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("AgentsView Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes("/api/v1/agents/capabilities")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCapabilities) });
      }
      if (url.includes("/api/v1/agents/runs")) {
        if (opts?.method === "POST" && url.includes("/step")) {
          const updatedRun = {
            ...mockRuns[0],
            current_step: 2,
            agent_type: "ResearchAgent",
            trace_log: [
              ...mockRuns[0].trace_log,
              {
                step_index: 2,
                from_agent: "PlanningAgent",
                to_agent: "ResearchAgent",
                intent: "progress_task",
                payload: { verified_facts: ["Telemetry stream active"] },
                timestamp: new Date().toISOString(),
              },
            ],
          };
          return Promise.resolve({ ok: true, json: () => Promise.resolve(updatedRun) });
        }
        if (opts?.method === "POST" && url.includes("/cancel")) {
          const cancelledRun = {
            ...mockRuns[0],
            status: "cancelled",
            error_message: "Workflow cancelled by operator.",
          };
          return Promise.resolve({ ok: true, json: () => Promise.resolve(cancelledRun) });
        }
        if (opts?.method === "POST") {
          const newRun = {
            id: "run-new",
            goal: "New Goal",
            agent_type: "PlanningAgent",
            status: "running",
            current_step: 0,
            max_steps: 5,
            input_payload: {},
            trace_log: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return Promise.resolve({ ok: true, json: () => Promise.resolve(newRun) });
        }
        if (url.match(/\/runs\/[a-zA-Z0-9-]+/)) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRuns[0]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRuns) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders Multi-Agent Orchestration Engine header and capabilities matrix", async () => {
    render(<AgentsView />);
    expect(screen.getByText("Multi-Agent Orchestration Engine")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("PlanningAgent").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("ResearchAgent").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("CodingAgent").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("ContentAgent").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("DiagnosticsAgent").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays immutable tool permission badges for each specialized agent", async () => {
    render(<AgentsView />);

    await waitFor(() => {
      expect(screen.getByText("plan_decompose")).toBeInTheDocument();
      expect(screen.getByText("search_web")).toBeInTheDocument();
      expect(screen.getByText("coding_diff")).toBeInTheDocument();
      expect(screen.getByText("generate_script")).toBeInTheDocument();
      expect(screen.getByText("check_health")).toBeInTheDocument();
    });
  });

  it("loads and displays active workflow runs and traceable message logs", async () => {
    render(<AgentsView />);

    await waitFor(() => {
      expect(screen.getAllByText("Plan and synthesize telemetry analysis").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Step 0")).toBeInTheDocument();
      expect(screen.getByText("Step 1")).toBeInTheDocument();
    });
  });

  it("advances workflow run step via Step Agent action", async () => {
    render(<AgentsView />);

    await waitFor(() => {
      expect(screen.getByText("Advance Next Step ➔")).toBeInTheDocument();
    });

    const stepBtn = screen.getByText("Advance Next Step ➔");
    fireEvent.click(stepBtn);

    await waitFor(() => {
      expect(screen.getByText("Step 2")).toBeInTheDocument();
      expect(screen.getByText(/Telemetry stream active/i)).toBeInTheDocument();
    });
  });

  it("cancels an active workflow run via Cancel Workflow button", async () => {
    render(<AgentsView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cancel Workflow/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: /Cancel Workflow/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Workflow cancelled by operator/i)).toBeInTheDocument();
    });
  });
});
