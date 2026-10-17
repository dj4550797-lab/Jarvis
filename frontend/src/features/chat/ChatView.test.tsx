import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatView } from "./ChatView";

// Mock fetch for chat tests
const mockProviders = [
  { name: "mock", available: true, models: ["mock-echo-v1"], error: null },
  { name: "ollama", available: false, models: [], error: "Runtime unreachable" },
];

const mockConversations = [
  {
    id: "conv-1",
    title: "Test Session 1",
    model: "mock",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello JARVIS",
        created_at: new Date().toISOString(),
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Hello! I am operating in mock mode.",
        model: "mock:mock-echo-v1",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/conversations/providers")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProviders),
    });
  }
  if (url.endsWith("/conversations")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockConversations),
    });
  }
  if (url.includes("/conversations/conv-1")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockConversations[0]),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("Phase 2 ChatView", () => {
  it("renders conversation list and active messages", async () => {
    render(<ChatView />);

    await waitFor(() => {
      expect(screen.getByText("Test Session 1")).toBeInTheDocument();
      expect(screen.getByText("Hello JARVIS")).toBeInTheDocument();
      expect(screen.getByText("mock:mock-echo-v1")).toBeInTheDocument();
    });
  });

  it("renders provider selector with discovery data", async () => {
    render(<ChatView />);

    await waitFor(() => {
      expect(screen.getByText("MOCK (Available)")).toBeInTheDocument();
    });
  });

  it("renders input field and send button", async () => {
    render(<ChatView />);

    const input = screen.getByPlaceholderText(
      "Type an instruction or command for JARVIS..."
    );
    expect(input).toBeInTheDocument();
  });
});
