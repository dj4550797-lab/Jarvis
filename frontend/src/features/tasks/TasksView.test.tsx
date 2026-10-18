import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TasksView } from "./TasksView";

const mockTasks = [
  {
    id: "task-001",
    name: "System Diagnostics Audit",
    task_type: "system_diagnostic",
    status: "running",
    progress: 45.0,
    progress_message: "Auditing memory allocations and virtual paging...",
    params: {},
    result: null,
    error: null,
    timeout_seconds: 300.0,
    idempotent: false,
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    completed_at: null,
    cancelled_at: null,
  },
  {
    id: "task-002",
    name: "Deep File Search",
    task_type: "file_search",
    status: "completed",
    progress: 100.0,
    progress_message: "Task completed successfully",
    params: { pattern: ".*\\.py$" },
    result: { total_matches: 42 },
    error: null,
    timeout_seconds: 120.0,
    idempotent: false,
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    cancelled_at: null,
  },
];

global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
  if (url.includes("/api/v1/tasks/recover") && opts?.method === "POST") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          interrupted_task_count: 1,
          interrupted_task_ids: ["task-orphaned-1"],
        }),
    });
  }
  if (url.includes("/api/v1/tasks/task-001/cancel") && opts?.method === "POST") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "cancelled",
          task_id: "task-001",
          cancelled: true,
          message: "Task cancellation requested",
        }),
    });
  }
  if (url.includes("/api/v1/tasks") && opts?.method === "POST") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "task-003",
          name: "New Workload Simulation",
          task_type: "simulation",
          status: "queued",
          progress: 0.0,
          progress_message: "Task queued",
          params: { steps: 5 },
          result: null,
          error: null,
          timeout_seconds: 180.0,
          idempotent: false,
          created_at: new Date().toISOString(),
        }),
    });
  }
  if (url.includes("/api/v1/tasks")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTasks),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("TasksView (Phase 6 Background Tasks)", () => {
  it("renders tasks metrics, active tasks monitor, and history table", async () => {
    render(<TasksView />);

    await waitFor(() => {
      expect(screen.getByText("Background Tasks & Operations")).toBeInTheDocument();
    });

    // Check Metrics Grid
    expect(screen.getByText("Running Tasks")).toBeInTheDocument();
    expect(screen.getByText("Active In-Flight Operations")).toBeInTheDocument();

    // Check Active Task Cards
    expect(screen.getAllByText("System Diagnostics Audit").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Auditing memory allocations and virtual paging...")).toBeInTheDocument();

    // Check Table
    expect(screen.getByText("Deep File Search")).toBeInTheDocument();
    expect(screen.getAllByText("COMPLETED").length).toBeGreaterThanOrEqual(1);
  });

  it("opens launch modal and enqueues new background task", async () => {
    render(<TasksView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Launch New Task/i })).toBeInTheDocument();
    });

    const launchBtn = screen.getByRole("button", { name: /Launch New Task/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(screen.getByText("Launch Background Task")).toBeInTheDocument();
      expect(screen.getByText("System Diagnostics")).toBeInTheDocument();
      expect(screen.getAllByText("Deep File Search").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Simulation")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Start Background Task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText("Launch Background Task")).not.toBeInTheDocument();
    });
  });

  it("triggers task recovery inspection", async () => {
    render(<TasksView />);

    await waitFor(() => {
      expect(screen.getByText("Inspect & Recover")).toBeInTheDocument();
    });

    const recoverBtn = screen.getByText("Inspect & Recover");
    fireEvent.click(recoverBtn);

    await waitFor(() => {
      expect(screen.getByText(/Safely recovered 1 interrupted tasks/)).toBeInTheDocument();
    });
  });

  it("cancels an active task", async () => {
    render(<TasksView />);

    await waitFor(() => {
      expect(screen.getAllByTitle("Cancel task immediately").length).toBeGreaterThanOrEqual(1);
    });

    const cancelBtn = screen.getAllByTitle("Cancel task immediately")[0];
    fireEvent.click(cancelBtn);

    // Cancel action triggered without error
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/tasks/task-001/cancel"),
        expect.anything()
      );
    });
  });
});
