import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock the fetch API for testing
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        status: "healthy",
        version: "0.1.0",
        environment: "testing",
        uptime_seconds: 42.5,
        database: {
          status: "healthy",
          journal_mode: "wal",
          foreign_keys: true,
          url: "sqlite:///./jarvis.db",
        },
        hardware: {
          os: "Microsoft Windows 10 Pro",
          os_version: "10.0.19045",
          architecture: "AMD64",
          cpu_logical: 8,
          ram_total_gb: 16.0,
          disk_free_gb: 120.5,
        },
        ai_provider: {
          configured_provider: "mock",
          local_model_enabled: false,
          local_model_name: "llama3.2:latest",
          status: "available",
        },
        data_directory: "C:\\Users\\admin\\AppData\\Local\\JARVIS",
      }),
  })
);

describe("JARVIS Frontend Foundation", () => {
  it("renders the navigation bar with brand and tabs", async () => {
    render(<App />);
    expect(screen.getByText("JARVIS")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("Devices")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders the dashboard view by default", async () => {
    render(<App />);
    expect(
      screen.getByText("System Diagnostics & Core Status")
    ).toBeInTheDocument();
    expect(screen.getByText("DATABASE (SQLITE)")).toBeInTheDocument();
  });
});
