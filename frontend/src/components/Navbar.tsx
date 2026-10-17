import React from "react";
import { Activity, Brain, Cpu, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { HealthResponse } from "../types";

interface NavbarProps {
  activeView: "dashboard" | "chat" | "memory" | "settings";
  setActiveView: (view: "dashboard" | "chat" | "memory" | "settings") => void;
  health: HealthResponse | null;
  latencyMs: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  health,
  latencyMs,
}) => {
  const isHealthy = health?.status === "healthy";
  const isDegraded = health?.status === "degraded";

  return (
    <header className="navbar" role="banner">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Cpu size={22} />
        </div>
        <div>
          <h1 className="brand-title">JARVIS</h1>
        </div>
      </div>

      <nav className="nav-links" aria-label="Main Navigation">
        <button
          className={`nav-button ${activeView === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveView("dashboard")}
        >
          <Activity size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`nav-button ${activeView === "chat" ? "active" : ""}`}
          onClick={() => setActiveView("chat")}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          className={`nav-button ${activeView === "memory" ? "active" : ""}`}
          onClick={() => setActiveView("memory")}
        >
          <Brain size={16} />
          <span>Memory</span>
        </button>
        <button
          className={`nav-button ${activeView === "settings" ? "active" : ""}`}
          onClick={() => setActiveView("settings")}
        >
          <SettingsIcon size={16} />
          <span>Settings</span>
        </button>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {latencyMs !== null && (
          <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            API {latencyMs}ms
          </span>
        )}
        <div
          className={`status-pill ${
            health ? (isHealthy ? "" : isDegraded ? "degraded" : "offline") : "offline"
          }`}
        >
          <span className="pulsing-dot" />
          <span>
            {health ? (isHealthy ? "CORE ONLINE" : isDegraded ? "DEGRADED" : "OFFLINE") : "CONNECTING"}
          </span>
        </div>
      </div>
    </header>
  );
};
