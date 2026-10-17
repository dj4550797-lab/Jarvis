import React from "react";
import {
  Folder,
  Server,
  Shield,
} from "lucide-react";
import { HealthResponse } from "../../types";

interface SettingsViewProps {
  health: HealthResponse | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health }) => {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px" }}>
          Application Settings & Preferences
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Configure AI provider adapters, runtime paths, and security constraints per CONFIGURATION.md.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* AI Provider Section */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Server size={20} style={{ color: "var(--cyan-bright)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
              AI Model Provider
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Active Provider Adapter
              </label>
              <select
                disabled
                value={health?.ai_provider.configured_provider || "mock"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontSize: "0.9rem",
                }}
              >
                <option value="mock">Local Foundation Adapter (Testing / Phase 1)</option>
                <option value="ollama">Ollama (Local Inference)</option>
                <option value="openai">OpenAI Compatible (Cloud)</option>
                <option value="anthropic">Anthropic Claude (Cloud)</option>
              </select>
              <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "6px" }}>
                Active routing is locked to the Foundation adapter during Phase 1. Dynamic routing will be unlocked in Phase 2.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Local Model Runtime Endpoint
              </label>
              <input
                type="text"
                readOnly
                value={health?.ai_provider.local_model_enabled ? "http://127.0.0.1:11434" : "Disabled (Phase 1 Baseline)"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Storage & Environment Paths */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Folder size={20} style={{ color: "var(--cyan-bright)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
              Persistent Storage & Database
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                SQLite Storage Location
              </label>
              <input
                type="text"
                readOnly
                value={health?.database.url || "sqlite:///./jarvis.db"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Application Data Directory
              </label>
              <input
                type="text"
                readOnly
                value={health?.data_directory || "%LOCALAPPDATA%\\JARVIS"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Security Policy Reminder */}
        <div className="glass-panel" style={{ padding: "24px", borderColor: "rgba(16, 185, 129, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Shield size={20} style={{ color: "var(--emerald-success)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600, color: "var(--emerald-success)" }}>
              Local-First Security Enforced
            </h3>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Per SECURITY.md, all backend communications are strictly bound to local loopback (<code>127.0.0.1</code>). No secrets or credentials are ever transmitted to external cloud providers without explicit authorization policies.
          </p>
        </div>
      </div>
    </div>
  );
};
