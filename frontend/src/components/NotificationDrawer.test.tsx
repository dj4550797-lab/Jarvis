import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationDrawer } from "./NotificationDrawer";
import { NotificationItem, NotificationPreference } from "../types";

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Task Completed",
    message: "Background diagnostic completed successfully.",
    priority: "normal",
    category: "task",
    read: false,
    delivered: true,
    suppressed_by_dnd: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    title: "Critical Security Notice",
    message: "Sandbox blocked unauthorized path traversal attempt.",
    priority: "critical",
    category: "security",
    read: true,
    delivered: true,
    suppressed_by_dnd: false,
    created_at: new Date().toISOString(),
  },
];

const mockPreferences: NotificationPreference = {
  id: "default",
  dnd_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  min_priority_during_quiet: "critical",
  desktop_notifications_enabled: true,
  sound_enabled: true,
};

describe("NotificationDrawer (Phase 6 Notifications & DND)", () => {
  it("renders notification items, badges, and unread counts when open", () => {
    const handleClose = vi.fn();
    const handleMarkRead = vi.fn();
    const handleMarkAllRead = vi.fn();
    const handleDelete = vi.fn();
    const handleToggleDnd = vi.fn();

    render(
      <NotificationDrawer
        isOpen={true}
        onClose={handleClose}
        notifications={mockNotifications}
        unreadCount={1}
        preferences={mockPreferences}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
        onToggleDnd={handleToggleDnd}
      />
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Task Completed")).toBeInTheDocument();
    expect(screen.getByText("Critical Security Notice")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("NORMAL")).toBeInTheDocument();
  });

  it("triggers Mark Read and Mark All Read actions", () => {
    const handleMarkRead = vi.fn();
    const handleMarkAllRead = vi.fn();

    render(
      <NotificationDrawer
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        unreadCount={1}
        preferences={mockPreferences}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={vi.fn()}
        onToggleDnd={vi.fn()}
      />
    );

    const markReadBtn = screen.getByText("Mark read");
    fireEvent.click(markReadBtn);
    expect(handleMarkRead).toHaveBeenCalledWith("notif-1");

    const markAllBtn = screen.getByText("Mark all read");
    fireEvent.click(markAllBtn);
    expect(handleMarkAllRead).toHaveBeenCalled();
  });

  it("toggles Do Not Disturb mode", () => {
    const handleToggleDnd = vi.fn();

    render(
      <NotificationDrawer
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        unreadCount={1}
        preferences={mockPreferences}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onDelete={vi.fn()}
        onToggleDnd={handleToggleDnd}
      />
    );

    const dndBtn = screen.getByText("DND: OFF");
    fireEvent.click(dndBtn);
    expect(handleToggleDnd).toHaveBeenCalledWith(true);
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <NotificationDrawer
        isOpen={false}
        onClose={vi.fn()}
        notifications={mockNotifications}
        unreadCount={0}
        preferences={mockPreferences}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onDelete={vi.fn()}
        onToggleDnd={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
