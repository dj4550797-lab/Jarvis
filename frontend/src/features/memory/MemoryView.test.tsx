import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryView } from "./MemoryView";

const mockMemoriesResponse = {
  total: 2,
  items: [
    {
      id: "mem-1",
      content: "User uses Python 3.12 and FastAPI exclusively",
      memory_type: "explicit_fact",
      category: "coding",
      is_uncertain: false,
      confidence: 1.0,
      source: "user",
      tags: ["python", "backend"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mem-2",
      content: "User may prefer dark theme in the evening",
      memory_type: "inferred",
      category: "ui",
      is_uncertain: true,
      confidence: 0.65,
      source: "system",
      tags: ["theme", "ui"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/memories/export")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMemoriesResponse),
    });
  }
  if (url.includes("/memories")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMemoriesResponse),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("Phase 3 MemoryView", () => {
  it("renders the memory header and action buttons", async () => {
    render(<MemoryView />);

    expect(screen.getByText("Persistent Memory & Context")).toBeInTheDocument();
    expect(screen.getByText("New Memory")).toBeInTheDocument();
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
  });

  it("renders memory items and badges correctly", async () => {
    render(<MemoryView />);

    await waitFor(() => {
      expect(
        screen.getByText("User uses Python 3.12 and FastAPI exclusively")
      ).toBeInTheDocument();
      expect(
        screen.getByText("User may prefer dark theme in the evening")
      ).toBeInTheDocument();
      expect(screen.getByText("Confirmed Fact")).toBeInTheDocument();
      expect(screen.getByText(/Inferred • 65% Confidence/)).toBeInTheDocument();
    });
  });

  it("opens create modal when clicking New Memory", async () => {
    render(<MemoryView />);

    const newBtn = screen.getByText("New Memory");
    fireEvent.click(newBtn);

    expect(screen.getByText("Create New Memory Item")).toBeInTheDocument();
    expect(screen.getByText("Save Memory")).toBeInTheDocument();
  });
});
