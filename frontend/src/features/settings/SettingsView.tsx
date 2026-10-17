import React, { useEffect, useState } from "react";
import {
  Cpu,
  Folder,
  Server,
  Shield,
} from "lucide-react";
import { AIProviderInfo, HealthResponse } from "../../types";
import { fetchProviders } from "../../services/api";

interface SettingsViewProps {
  health: HealthResponse | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health }) => {
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      console.error("Failed to load providers in settings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px" }}>
          Application Settings & Preferences
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Configure AI provider adapters, runtime paths, and security constraints per CONFIGURATION.md and Phase 2.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Phase 2: AI Provider Registry & Status */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Server size={20} style={{ color: "var(--cyan-bright)" }} />
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
                AI Providers & Model Registry
              </h3>
            </div>
            <button
              onClick={loadProviders}
              disabled={loading}
              style={{
                background: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                color: "var(--cyan-bright)",
                padding: "4px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {loading ? "Refreshing..." : "Refresh Discovery"}
            </button>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
            JARVIS routes prompts according to strict local-first and honest-disclosure rules. If your primary provider is unreachable, fallback to Mock diagnostic mode is clearly flagged.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {providers.map((p) => (
              <div
                key={p.name}
                style={{
                  background: "var(--bg-input)",
                  border: `1px solid ${p.available ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "0.95rem" }}>
                    <Cpu size={16} style={{ color: p.available ? "var(--emerald-success)" : "#fbbf24" }} />
                    <span style={{ textTransform: "uppercase" }}>{p.name}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: p.available ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: p.available ? "var(--emerald-success)" : "#fbbf24",
                    }}
                  >
                    {p.available ? "Available" : "Offline"}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {p.models.length > 0 ? (
                    <div>
                      <span style={{ color: "var(--text-faint)" }}>Models: </span>
                      <span>{p.models.join(", ")}</span>
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-faint)" }}>
                      {p.error ? p.error.slice(0, 70) + "..." : "No active models reported"}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {providers.length === 0 && (
              <div style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>
                Loading provider statuses from backend...
              </div>
            )}
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
