import React from "react";
import {
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HealthResponse } from "../../types";

interface DashboardViewProps {
  health: HealthResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenChat: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  health,
  loading,
  onRefresh,
  onOpenChat,
}) => {
  const formatUptime = (seconds?: number) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            System Diagnostics & Core Status
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Real-time hardware verification, database health, and process runtime metrics.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.88rem",
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh Diagnostics</span>
          </button>
          <button
            onClick={onOpenChat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--cyan-primary), #0284c7)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.88rem",
              boxShadow: "0 0 15px rgba(6, 182, 212, 0.35)",
            }}
          >
            <Sparkles size={16} />
            <span>Open Assistant</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="dashboard-grid">
        {/* Core Status */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>CORE SERVICE</span>
            <div className="metric-icon-wrap">
              <Server size={20} />
            </div>
          </div>
          <div className="metric-value">
            {health?.status ? health.status.toUpperCase() : "CHECKING..."}
          </div>
          <div className="metric-subtext">
            Version {health?.version || "0.1.0"} • {health?.environment || "development"}
          </div>
        </div>

        {/* Database Health */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>DATABASE (SQLITE)</span>
            <div
              className="metric-icon-wrap"
              style={{
                background:
                  health?.database.status === "healthy"
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(244, 63, 94, 0.12)",
                color:
                  health?.database.status === "healthy"
                    ? "var(--emerald-success)"
                    : "var(--rose-danger)",
              }}
            >
              <Database size={20} />
            </div>
          </div>
          <div className="metric-value">
            {health?.database.status === "healthy" ? "HEALTHY" : "OFFLINE"}
          </div>
          <div className="metric-subtext">
            WAL Mode: {health?.database.journal_mode?.toUpperCase() || "N/A"} • FK:{" "}
            {health?.database.foreign_keys ? "ENABLED" : "DISABLED"}
          </div>
        </div>

        {/* System Memory & CPU */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>HARDWARE</span>
            <div className="metric-icon-wrap">
              <Cpu size={20} />
            </div>
          </div>
          <div className="metric-value">
            {health?.hardware.ram_total_gb ? `${health.hardware.ram_total_gb} GB` : "DETECTED"}
          </div>
          <div className="metric-subtext">
            {health?.hardware.cpu_logical || "?"} Logical Threads • {health?.hardware.architecture || "x64"}
          </div>
        </div>

        {/* Process Uptime */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>BACKEND UPTIME</span>
            <div className="metric-icon-wrap">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value">{formatUptime(health?.uptime_seconds)}</div>
          <div className="metric-subtext">Continuous loopback process</div>
        </div>
      </div>

      {/* Detailed Diagnostics Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Host & Storage Specs */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <HardDrive size={20} style={{ color: "var(--cyan-bright)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
              Operating System & Storage
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Platform OS</span>
              <span style={{ fontWeight: 600 }}>{health?.hardware.os || "Microsoft Windows"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>OS Build</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                {health?.hardware.os_version || "10.0.19045"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Storage Free Space</span>
              <span style={{ fontWeight: 600, color: "var(--emerald-success)" }}>
                {health?.hardware.disk_free_gb ? `${health.hardware.disk_free_gb} GB Free` : "Available"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Persistent Data Directory</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  maxWidth: "260px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={health?.data_directory}
              >
                {health?.data_directory || "%LOCALAPPDATA%\\JARVIS"}
              </span>
            </div>
          </div>
        </div>

        {/* AI & Security Subsystem */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <ShieldCheck size={20} style={{ color: "var(--cyan-bright)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
              AI Engine & Security Controls
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>AI Provider Adapter</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                  color: "var(--cyan-bright)",
                  background: "rgba(6, 182, 212, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {health?.ai_provider.configured_provider || "mock"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Provider Status</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <CheckCircle2 size={14} style={{ color: "var(--emerald-success)" }} />
                <span>{health?.ai_provider.status.toUpperCase() || "AVAILABLE"}</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Local Model Runtime</span>
              <span style={{ color: "var(--text-faint)" }}>
                {health?.ai_provider.local_model_enabled ? "Enabled" : "Disabled (Phase 1 Baseline)"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Loopback Isolation</span>
              <span style={{ color: "var(--emerald-success)", fontWeight: 600 }}>
                127.0.0.1 (Strict Loopback)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
