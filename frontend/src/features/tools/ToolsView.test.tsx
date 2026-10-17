import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolsView } from "./ToolsView";

const mockTools = [
  {
    name: "file_search",
    description: "Search for files matching a pattern within approved workspace directories.",
    capability: "filesystem.read",
    requires_confirmation: false,
    parameters_schema: {},
  },
  {
    name: "file_read",
    description: "Read text content from a file located within approved workspace directories.",
    capability: "filesystem.read",
    requires_confirmation: false,
    parameters_schema: {},
  },
  {
    name: "file_write",
    description: "Write text content to a file within approved workspace directories.",
    capability: "filesystem.write",
    requires_confirmation: true,
    parameters_schema: {},
  },
  {
    name: "system_status",
    description: "Inspect real-time system metrics: CPU, RAM, and disk utilization.",
    capability: "system.control",
    requires_confirmation: false,
    parameters_schema: {},
  },
];

const mockEmergencyStatus = {
  is_active: false,
  reason: null,
  engaged_at: null,
  interrupted_tasks_count: 0,
};

const mockAuditLogs = [
  {
    id: "log-1",
    event_type: "tool_exec:system_status",
    component: "tools",
    severity: "INFO",
    message: "Executed tool 'system_status'",
    details: { success: true, elapsed_ms: 3.2 },
    created_at: new Date().toISOString(),
  },
];

global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
  if (url.includes("/api/v1/tools/emergency-stop") && opts?.method === "POST") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          is_active: true,
          reason: "Emergency stop engaged by test",
          engaged_at: new Date().toISOString(),
          interrupted_tasks_count: 1,
        }),
    });
  }
  if (url.includes("/api/v1/tools/emergency-stop")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockEmergencyStatus),
    });
  }
  if (url.includes("/api/v1/tools/audit")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockAuditLogs),
    });
  }
  if (url.includes("/api/v1/tools/execute")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          output: { matches_count: 2, matches: [{ name: "README.md" }] },
          verifiable: true,
          requires_confirmation: false,
          metadata: { execution_time_ms: 12.5 },
        }),
    });
  }
  if (url.includes("/api/v1/tools")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTools),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("ToolsView (Phase 5 Controlled Computer Operations)", () => {
  it("renders tool catalog, emergency stop bar, and audit logs", async () => {
    render(<ToolsView />);

    await waitFor(() => {
      expect(
        screen.getByText("Controlled Computer Operations")
      ).toBeInTheDocument();
    });

    // Check Emergency stop banner
    expect(screen.getByText("SYSTEM SAFETY OPERATIONAL")).toBeInTheDocument();
    expect(screen.getByText("EMERGENCY STOP")).toBeInTheDocument();

    // Check Tool catalog
    expect(screen.getAllByText("file_search").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("file_read").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("file_write").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("system_status").length).toBeGreaterThanOrEqual(1);

    // Check Audit logs
    expect(screen.getByText("tool_exec:system_status")).toBeInTheDocument();
  });

  it("triggers tool execution and renders output", async () => {
    render(<ToolsView />);

    await waitFor(() => {
      expect(screen.getByText("Execute Tool")).toBeInTheDocument();
    });

    const runBtn = screen.getByText("Execute Tool");
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText("SUCCESS")).toBeInTheDocument();
      expect(screen.getByText(/README\.md/)).toBeInTheDocument();
    });
  });

  it("engages emergency stop when button is clicked", async () => {
    render(<ToolsView />);

    await waitFor(() => {
      expect(screen.getByText("EMERGENCY STOP")).toBeInTheDocument();
    });

    const stopBtn = screen.getByText("EMERGENCY STOP");
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByText("EMERGENCY STOP ENGAGED")).toBeInTheDocument();
      expect(screen.getByText("Confirm Reset")).toBeInTheDocument();
    });
  });
});
