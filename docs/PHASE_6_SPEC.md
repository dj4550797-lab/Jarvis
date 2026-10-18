# Phase 6 — Notifications and Background Tasks Specification

## 1. Overview & Objectives

Phase 6 implements asynchronous task execution and proactive desktop/UI notifications for the JARVIS desktop assistant. It allows JARVIS to execute long-running operations (such as deep file searches, batch audits, system diagnostics, and simulated workloads) in the background without blocking the chat interface, UI event loop, or AI provider streaming.

### Key Objectives
1. **Background Task Engine**:
   - Asynchronous worker queue and task supervisor.
   - Discrete, verifiable states: `queued`, `running`, `completed`, `failed`, `cancelled`, `interrupted`.
   - Continuous progress tracking (0.0% to 100.0%) with human-readable status messages.
   - Non-blocking execution, execution timeouts, and graceful cancellation.
   - Task execution history stored in SQLite WAL database.
   - Safe crash/restart recovery: interrupted non-idempotent tasks are marked `interrupted` and never blindly re-executed to prevent unverified external side-effects.

2. **Notification System**:
   - Tiered notification priorities: `low`, `normal`, `high`, `critical`.
   - Do Not Disturb (DND) mode and scheduled Quiet Hours (e.g. 22:00 - 08:00).
   - Priority thresholding: `critical` notifications can break through Quiet Hours/DND.
   - Proactive notifications: background task completions, failures, and system alerts automatically push notifications.
   - Desktop integration with graceful fallback for headless or restricted environments.
   - Full read/unread lifecycle, badge indicators, and preferences persistence.

3. **User Interface (`TasksView` & Notification Drawer)**:
   - Live Tasks dashboard with animated progress bars, status indicators, and elapsed time.
   - Immediate cancellation controls for queued and running jobs.
   - Task initiation panel for running background operations.
   - Header notification bell with unread count badge and quick-access notification tray.
   - Full DND and Quiet Hours preferences configuration.

---

## 2. Architecture & Data Model

### 2.1 Database Models (`backend/app/models/task.py` and `notification.py`)

#### `BackgroundTask` (`tasks` table)
- `id`: String (UUIDv4 primary key)
- `name`: String(255)
- `task_type`: String(64) (`file_search`, `system_diagnostic`, `simulation`, `custom`)
- `status`: String(32) (`queued`, `running`, `completed`, `failed`, `cancelled`, `interrupted`)
- `progress`: Float (0.0 to 100.0)
- `progress_message`: String(512), nullable
- `params`: JSON / Text
- `result`: JSON / Text, nullable
- `error`: Text, nullable
- `timeout_seconds`: Float, default 300.0
- `idempotent`: Boolean, default False
- `created_at`: DateTime(timezone=True)
- `started_at`: DateTime(timezone=True), nullable
- `completed_at`: DateTime(timezone=True), nullable
- `cancelled_at`: DateTime(timezone=True), nullable

#### `Notification` (`notifications` table)
- `id`: String (UUIDv4 primary key)
- `title`: String(255)
- `message`: Text
- `priority`: String(32) (`low`, `normal`, `high`, `critical`)
- `category`: String(64) (`task`, `system`, `security`, `reminder`, `general`)
- `read`: Boolean, default False
- `delivered`: Boolean, default False
- `suppressed_by_dnd`: Boolean, default False
- `created_at`: DateTime(timezone=True)
- `read_at`: DateTime(timezone=True), nullable
- `metadata_json`: Text, nullable

#### `NotificationPreference` (`notification_preferences` table)
- `id`: String (singleton key: `default`)
- `dnd_enabled`: Boolean, default False
- `quiet_hours_enabled`: Boolean, default False
- `quiet_hours_start`: String(5), default "22:00"
- `quiet_hours_end`: String(5), default "08:00"
- `min_priority_during_quiet`: String(32), default "critical"
- `desktop_notifications_enabled`: Boolean, default True
- `sound_enabled`: Boolean, default True
- `updated_at`: DateTime(timezone=True)

---

## 3. API Surface

### Tasks API (`/api/v1/tasks`)
- `GET /api/v1/tasks`: List tasks with optional `status` filter and pagination.
- `POST /api/v1/tasks`: Enqueue a background task.
- `GET /api/v1/tasks/{task_id}`: Retrieve task status, progress, and result.
- `POST /api/v1/tasks/{task_id}/cancel`: Request immediate task cancellation.
- `POST /api/v1/tasks/recover`: Trigger safe recovery inspection of orphaned tasks.

### Notifications API (`/api/v1/notifications`)
- `GET /api/v1/notifications`: List notifications with unread/category filters.
- `GET /api/v1/notifications/unread-count`: Get unread count.
- `POST /api/v1/notifications`: Post a new notification (also sends desktop toast if eligible).
- `PATCH /api/v1/notifications/{id}/read`: Mark notification as read.
- `POST /api/v1/notifications/mark-all-read`: Mark all notifications as read.
- `DELETE /api/v1/notifications/{id}`: Delete a notification.
- `GET /api/v1/notifications/preferences`: Get DND and quiet hours configuration.
- `PUT /api/v1/notifications/preferences`: Update preferences.

---

## 4. Verification & Acceptance Criteria
1. Background tasks execute asynchronously without blocking FastAPI or client requests.
2. Progress increases monotonically from 0% to 100% with informative status messages.
3. Cancellation immediately terminates execution and marks status as `cancelled`.
4. Timeouts cleanly stop execution and mark status as `failed` with timeout diagnostic.
5. On system restart / startup recovery, interrupted tasks are safely marked `interrupted`, with no non-idempotent jobs re-run blindly.
6. Quiet Hours and DND suppress low/normal priority notifications while allowing critical alerts.
7. Automated tests pass for all task and notification flows.
