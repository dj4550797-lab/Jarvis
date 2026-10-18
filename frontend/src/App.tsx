import React, { useEffect, useState } from "react";
import { Navbar, NavView } from "./components/Navbar";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { DashboardView } from "./features/dashboard/DashboardView";
import { ChatView } from "./features/chat/ChatView";
import { MemoryView } from "./features/memory/MemoryView";
import { DeviceDiagnosticsView } from "./features/diagnostics/DeviceDiagnosticsView";
import { ToolsView } from "./features/tools/ToolsView";
import { TasksView } from "./features/tasks/TasksView";
import { CodingView } from "./features/coding/CodingView";
import { ResearchView } from "./features/research/ResearchView";
import { SettingsView } from "./features/settings/SettingsView";
import {
  deleteNotification,
  fetchHealth,
  fetchNotificationPreferences,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "./services/api";
import { HealthResponse, NotificationItem, NotificationPreference } from "./types";

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<NavView>("dashboard");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);

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

  const loadNotificationData = async () => {
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
      const list = await fetchNotifications(false, undefined, 30);
      setNotifications(list);
      const prefs = await fetchNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      // Quiet fail if server is offline or loading
      console.debug("Notification sync status:", err);
    }
  };

  useEffect(() => {
    checkHealth();
    loadNotificationData();
    const healthInterval = setInterval(checkHealth, 10000);
    const notifInterval = setInterval(loadNotificationData, 5000);
    return () => {
      clearInterval(healthInterval);
      clearInterval(notifInterval);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      await loadNotificationData();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotificationData();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      await loadNotificationData();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleToggleDnd = async (enabled: boolean) => {
    try {
      const updated = await updateNotificationPreferences({ dnd_enabled: enabled });
      setPreferences(updated);
      await loadNotificationData();
    } catch (err) {
      console.error("Failed to toggle DND:", err);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        health={health}
        latencyMs={latencyMs}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        preferences={preferences}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDeleteNotification}
        onToggleDnd={handleToggleDnd}
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
        {activeView === "memory" && <MemoryView />}
        {activeView === "devices" && <DeviceDiagnosticsView />}
        {activeView === "tools" && <ToolsView />}
        {activeView === "tasks" && <TasksView />}
        {activeView === "coding" && <CodingView />}
        {activeView === "research" && <ResearchView />}
        {activeView === "settings" && <SettingsView health={health} />}
      </main>
    </div>
  );
};

export default App;
