import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CodingView } from "./CodingView";

const mockInspectionResult = {
  root_path: "F:\\Jarvis",
  directory_count: 5,
  total_files_scanned: 12,
  capped: false,
  files: [
    {
      name: "inspector.py",
      relative_path: "backend/app/coding/inspector.py",
      absolute_path: "F:\\Jarvis\\backend\\app\\coding\\inspector.py",
      extension: ".py",
      size_bytes: 4096,
      line_count: 140,
      is_text: true,
    },
  ],
};

const mockSearchResult = {
  root_path: "F:\\Jarvis",
  query: "ProjectInspector",
  is_regex: false,
  total_matches: 1,
  capped: false,
  matches: [
    {
      file: "inspector.py",
      relative_path: "backend/app/coding/inspector.py",
      absolute_path: "F:\\Jarvis\\backend\\app\\coding\\inspector.py",
      line_number: 42,
      line_content: "class ProjectInspector:",
    },
  ],
};

const mockSyntaxResult = {
  valid: true,
  errors: [],
  message: "Python syntax is valid.",
};

const mockTraceResult = {
  detected_language: "python",
  error_type: "ValueError",
  error_message: "Invalid parameter provided",
  total_frames: 1,
  frames: [
    {
      file: "F:\\Jarvis\\backend\\app\\coding\\inspector.py",
      line: 45,
      function: "inspect_directory",
      code: "raise ValueError()",
      is_local_project_file: true,
    },
  ],
  analysis: {
    primary_culprit: {
      file: "F:\\Jarvis\\backend\\app\\coding\\inspector.py",
      line: 45,
      function: "inspect_directory",
      code: "raise ValueError()",
      is_local_project_file: true,
    },
    summary: "ValueError encountered.",
    suggestions: ["Verify parameters passed to inspect_directory."],
  },
};

const mockSnapshots = [
  {
    id: "snap-12345678-abcd",
    file_path: "F:\\Jarvis\\backend\\app\\test.py",
    original_content: "orig",
    diff_patch: "--- a\n+++ b",
    reason: "Test snapshot",
    restored: false,
    created_at: new Date().toISOString(),
    restored_at: null,
  },
];

const mockTestResult = {
  target: "backend",
  command: "pytest tests/test_coding.py",
  cwd: "F:\\Jarvis\\backend",
  passed: true,
  exit_code: 0,
  elapsed_ms: 250.0,
  stdout: "23 passed in 1.2s",
  stderr: "",
  summary: "Test run PASSED with exit code 0 in 250.0ms",
};

describe("CodingView Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string, _opts?: any) => {
      if (url.includes("/api/v1/coding/inspect")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockInspectionResult) });
      }
      if (url.includes("/api/v1/coding/search")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSearchResult) });
      }
      if (url.includes("/api/v1/coding/validate-syntax")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSyntaxResult) });
      }
      if (url.includes("/api/v1/coding/diagnose")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTraceResult) });
      }
      if (url.includes("/api/v1/coding/snapshots")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSnapshots) });
      }
      if (url.includes("/api/v1/coding/run-tests")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTestResult) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders Coding Assistant header and default Inspector tab", () => {
    render(<CodingView />);
    expect(screen.getByText("Coding Assistance")).toBeInTheDocument();
    expect(screen.getByText("Sandboxed Directory Inspection")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inspect Workspace/i })).toBeInTheDocument();
  });

  it("triggers workspace directory inspection and renders files", async () => {
    render(<CodingView />);
    const inspectBtn = screen.getByRole("button", { name: /Inspect Workspace/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText("Total Files Scanned")).toBeInTheDocument();
      expect(screen.getByText("inspector.py")).toBeInTheDocument();
    });
  });

  it("performs code symbol search and renders results", async () => {
    render(<CodingView />);
    const searchInput = screen.getByPlaceholderText(/Search identifiers/i);
    fireEvent.change(searchInput, { target: { value: "ProjectInspector" } });

    const searchBtn = screen.getByRole("button", { name: /^Search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Found 1 match/i)).toBeInTheDocument();
      expect(screen.getByText("class ProjectInspector:")).toBeInTheDocument();
    });
  });

  it("switches to Diagnostics tab and validates AST syntax", async () => {
    render(<CodingView />);
    const diagTabBtn = screen.getByRole("button", { name: /Diagnostics & AST Syntax/i });
    fireEvent.click(diagTabBtn);

    expect(screen.getByText("Line-Accurate AST Syntax Validation")).toBeInTheDocument();

    const validateBtn = screen.getByRole("button", { name: /Validate Syntax/i });
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(screen.getByText("Valid Python Syntax")).toBeInTheDocument();
    });
  });

  it("diagnoses stack traces and renders primary culprit", async () => {
    render(<CodingView />);
    const diagTabBtn = screen.getByRole("button", { name: /Diagnostics & AST Syntax/i });
    fireEvent.click(diagTabBtn);

    const traceSubTabBtn = screen.getByRole("button", { name: /Stack Trace & Culprit Analyzer/i });
    fireEvent.click(traceSubTabBtn);

    const diagnoseBtn = screen.getByRole("button", { name: /Diagnose Stack Trace/i });
    fireEvent.click(diagnoseBtn);

    await waitFor(() => {
      expect(screen.getByText(/Detected: python \(ValueError\)/i)).toBeInTheDocument();
      expect(screen.getByText("Primary Culprit:")).toBeInTheDocument();
      expect(screen.getAllByText("inspect_directory").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("switches to Diff, Patch & Rollback tab and lists snapshots", async () => {
    render(<CodingView />);
    const patcherTabBtn = screen.getByRole("button", { name: /Diff, Patch & Rollback/i });
    fireEvent.click(patcherTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Pre-Modification Snapshots & One-Click Rollback")).toBeInTheDocument();
      expect(screen.getByText("snap-123")).toBeInTheDocument();
      expect(screen.getByText("Rollback")).toBeInTheDocument();
    });
  });

  it("switches to Controlled Test Runner tab and executes tests", async () => {
    render(<CodingView />);
    const runnerTabBtn = screen.getByRole("button", { name: /Controlled Test Runner/i });
    fireEvent.click(runnerTabBtn);

    expect(screen.getByText("Controlled Project Test Execution")).toBeInTheDocument();

    const runBtn = screen.getByRole("button", { name: /Run Tests/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Test run PASSED with exit code 0/i)).toBeInTheDocument();
      expect(screen.getByText(/23 passed in 1.2s/i)).toBeInTheDocument();
    });
  });
});
