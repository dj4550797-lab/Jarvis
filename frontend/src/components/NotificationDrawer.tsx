import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Moon,
  Trash2,
  X,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { NotificationItem, NotificationPreference, NotificationPriorityType } from "../types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreference | null;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onToggleDnd: (enabled: boolean) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  preferences,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onToggleDnd,
}) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getPriorityBadge = (priority: NotificationPriorityType) => {
    switch (priority) {
      case "critical":
        return <span className="badge badge-critical"><ShieldAlert size={12} /> CRITICAL</span>;
      case "high":
        return <span className="badge badge-high"><AlertTriangle size={12} /> HIGH</span>;
      case "normal":
        return <span className="badge badge-normal"><Info size={12} /> NORMAL</span>;
      case "low":
      default:
        return <span className="badge badge-low"><Clock size={12} /> LOW</span>;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="notification-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="notification-drawer-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={18} className="text-accent" />
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>Notifications</h3>
            {unreadCount > 0 && (
              <span className="unread-counter-badge">{unreadCount}</span>
            )}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close notification drawer">
            <X size={18} />
          </button>
        </div>

        {/* Quick Preferences Bar */}
        <div className="notification-quick-prefs">
          <button
            className={`dnd-toggle-btn ${preferences?.dnd_enabled ? "dnd-active" : ""}`}
            onClick={() => onToggleDnd(!preferences?.dnd_enabled)}
            title="Toggle Do Not Disturb (critical alerts always bypass)"
          >
            {preferences?.dnd_enabled ? <BellOff size={14} /> : <Moon size={14} />}
            <span>DND: {preferences?.dnd_enabled ? "ON" : "OFF"}</span>
          </button>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`filter-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </button>
            <button
              className={`filter-pill ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={onMarkAllRead}
              title="Mark all as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="notification-list-scroll">
          {filtered.length === 0 ? (
            <div className="empty-notifications-state">
              <Check size={32} style={{ opacity: 0.35, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontWeight: 500, color: "var(--text-muted)" }}>
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>
                Background task updates and system alerts will appear here.
              </span>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`notification-item-card ${!item.read ? "is-unread" : ""}`}
              >
                <div className="notification-item-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {!item.read && <span className="unread-dot" title="Unread" />}
                    {getPriorityBadge(item.priority)}
                    <span className="notification-category-tag">{item.category}</span>
                  </div>
                  <span className="notification-time">{formatTimestamp(item.created_at)}</span>
                </div>

                <div className="notification-title">{item.title}</div>
                <div className="notification-message">{item.message}</div>

                {item.suppressed_by_dnd && (
                  <div className="notification-dnd-note">
                    <Moon size={11} /> Suppressed by DND / Quiet Hours
                  </div>
                )}

                <div className="notification-item-actions">
                  {!item.read && (
                    <button
                      className="text-button"
                      onClick={() => onMarkRead(item.id)}
                    >
                      <Check size={13} /> Mark read
                    </button>
                  )}
                  <button
                    className="text-button text-button-danger"
                    onClick={() => onDelete(item.id)}
                    title="Delete notification"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
