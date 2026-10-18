import {
  Activity,
  Bell,
  BookOpen,
  Brain,
  Code,
  Cpu,
  ListTodo,
  MessageSquare,
  Radio,
  Settings as SettingsIcon,
  Wrench,
} from "lucide-react";
import { HealthResponse } from "../types";

export type NavView = "dashboard" | "chat" | "memory" | "devices" | "tools" | "tasks" | "coding" | "research" | "settings";

interface NavbarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  health: HealthResponse | null;
  latencyMs: number | null;
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  health,
  latencyMs,
  unreadCount = 0,
  onOpenNotifications,
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
          className={`nav-button ${activeView === "devices" ? "active" : ""}`}
          onClick={() => setActiveView("devices")}
        >
          <Radio size={16} />
          <span>Devices</span>
        </button>
        <button
          className={`nav-button ${activeView === "tools" ? "active" : ""}`}
          onClick={() => setActiveView("tools")}
        >
          <Wrench size={16} />
          <span>Tools</span>
        </button>
        <button
          className={`nav-button ${activeView === "tasks" ? "active" : ""}`}
          onClick={() => setActiveView("tasks")}
        >
          <ListTodo size={16} />
          <span>Tasks</span>
        </button>
        <button
          className={`nav-button ${activeView === "coding" ? "active" : ""}`}
          onClick={() => setActiveView("coding")}
        >
          <Code size={16} />
          <span>Coding</span>
        </button>
        <button
          className={`nav-button ${activeView === "research" ? "active" : ""}`}
          onClick={() => setActiveView("research")}
        >
          <BookOpen size={16} />
          <span>Research</span>
        </button>
        <button
          className={`nav-button ${activeView === "settings" ? "active" : ""}`}
          onClick={() => setActiveView("settings")}
        >
          <SettingsIcon size={16} />
          <span>Settings</span>
        </button>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Notification Bell with Badge */}
        <button
          className="nav-notification-btn"
          onClick={onOpenNotifications}
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="bell-badge-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

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
