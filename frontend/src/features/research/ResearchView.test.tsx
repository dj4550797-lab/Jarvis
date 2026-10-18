import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ResearchView } from "./ResearchView";

const mockSessions = [
  {
    id: "sess-001",
    title: "Rust Borrow Checker Analysis",
    topic: "Systems Programming",
    status: "active",
    summary: "Investigation into memory safety invariants.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sources: [
      {
        id: "src-001",
        session_id: "sess-001",
        title: "Rust RFC 2094 Non-Lexical Lifetimes",
        snippet: "NLL improves borrow checking precision across loop bodies.",
        url: "https://rust-lang.github.io/rfcs/2094-nll.html",
        is_verified: true,
        confidence: 1.0,
        notes: "Official accepted RFC.",
        created_at: new Date().toISOString(),
      },
      {
        id: "src-002",
        session_id: "sess-001",
        title: "Speculative Rust Compiler Optimization Hypothesis",
        snippet: "Speculation that polonius borrow checker slows compilation by 2x.",
        url: null,
        is_verified: false,
        confidence: 0.35,
        notes: "Unverified forum assertion requiring benchmark data.",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

const mockExport = {
  session_id: "sess-001",
  format: "markdown",
  content: "# Research Report: Rust Borrow Checker Analysis\n\n## 1. Verified Facts\nRust RFC 2094",
  filename: "research_report_sess-001.md",
};

describe("ResearchView Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes("/api/v1/research/sessions") && !url.includes("export") && !url.includes("sources")) {
        if (opts?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "sess-new",
                title: "New Topic",
                topic: "AI",
                status: "active",
                summary: "New summary",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sources: [],
              }),
          });
        }
        if (url.match(/\/sessions\/[a-zA-Z0-9-]+/)) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSessions[0]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSessions) });
      }
      if (url.includes("/sources") && opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "src-new",
              session_id: "sess-001",
              title: "Added Citation",
              snippet: "Added snippet",
              is_verified: true,
              confidence: 0.9,
              created_at: new Date().toISOString(),
            }),
        });
      }
      if (url.includes("/export")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockExport) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders Research Assistant header and loads sessions", async () => {
    render(<ResearchView />);
    expect(screen.getByText("Research Assistant")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Rust Borrow Checker Analysis").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Investigation into memory safety invariants/i)).toBeInTheDocument();
    });
  });

  it("displays Strict Honesty metrics badges for verified and uncertain claims", async () => {
    render(<ResearchView />);

    await waitFor(() => {
      expect(screen.getByText("Verified Empirical Facts")).toBeInTheDocument();
      expect(screen.getByText("Hypotheses / Uncertain Claims")).toBeInTheDocument();
      expect(screen.getByText("Rust RFC 2094 Non-Lexical Lifetimes")).toBeInTheDocument();
      expect(screen.getByText(/Speculative Rust Compiler Optimization Hypothesis/i)).toBeInTheDocument();
    });
  });

  it("filters citations by verified vs uncertain status", async () => {
    render(<ResearchView />);

    await waitFor(() => {
      expect(screen.getByText("Rust RFC 2094 Non-Lexical Lifetimes")).toBeInTheDocument();
    });

    // Filter to verified only
    const verifiedFilterBtn = screen.getByRole("button", { name: /Verified Facts \(1\)/i });
    fireEvent.click(verifiedFilterBtn);

    expect(screen.getByText("Rust RFC 2094 Non-Lexical Lifetimes")).toBeInTheDocument();
    expect(screen.queryByText(/Speculative Rust Compiler Optimization Hypothesis/i)).not.toBeInTheDocument();

    // Filter to uncertain only
    const uncertainFilterBtn = screen.getByRole("button", { name: /Uncertain Claims \(1\)/i });
    fireEvent.click(uncertainFilterBtn);

    expect(screen.getByText(/Speculative Rust Compiler Optimization Hypothesis/i)).toBeInTheDocument();
    expect(screen.queryByText("Rust RFC 2094 Non-Lexical Lifetimes")).not.toBeInTheDocument();
  });

  it("opens Add Citation modal and shows Strict Honesty toggle", async () => {
    render(<ResearchView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Citation \/ Fact/i })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /Add Citation \/ Fact/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Add Documented Citation or Evidence")).toBeInTheDocument();
    expect(screen.getByText(/Empirically Verified Fact \(Strict Honesty Rule\)/i)).toBeInTheDocument();
  });

  it("opens Export Report modal and displays Markdown content", async () => {
    render(<ResearchView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export Report/i })).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export Report/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export Research Report")).toBeInTheDocument();
      expect(screen.getByText(/# Research Report: Rust Borrow Checker Analysis/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download File/i })).toBeInTheDocument();
    });
  });
});
