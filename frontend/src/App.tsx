import React, { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardView } from "./features/dashboard/DashboardView";
import { ChatView } from "./features/chat/ChatView";
import { SettingsView } from "./features/settings/SettingsView";
import { fetchHealth } from "./services/api";
import { HealthResponse } from "./types";

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "chat" | "settings">("dashboard");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const checkHealth = async () => {
    const t0 = performance.now();
    try {
      const data = await fetchHealth();
      const t1 = performance.now();
      setLatencyMs(Math.round(t1 - t0));
      setHealth(data);
    } catch (err) {
      console.warn("Could not reach backend health endpoint:", err);
      setHealth(null);
      setLatencyMs(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        health={health}
        latencyMs={latencyMs}
      />
      <main className="main-viewport">
        {activeView === "dashboard" && (
          <DashboardView
            health={health}
            loading={loadingHealth}
            onRefresh={checkHealth}
            onOpenChat={() => setActiveView("chat")}
          />
        )}
        {activeView === "chat" && <ChatView />}
        {activeView === "settings" && <SettingsView health={health} />}
      </main>
    </div>
  );
};

export default App;
