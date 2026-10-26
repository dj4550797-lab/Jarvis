# API.md — REST & WebSocket Service Contracts

This document specifies the core API contracts, REST endpoints, WebSocket event channels, and request/response payloads exposed by the **JARVIS** backend service (`backend/src/jarvis`).

---

## 1. General Principles & Conventions

- **Base URL:** `http://127.0.0.1:8000/api/v1`
- **Content Type:** `application/json` (UTF-8)
- **Authentication:** Local host loopback calls are authenticated by session cookie or local token; Android mobile synchronization calls use bearer token authentication.
- **Error Format:** Standardized RFC 7807 problem details:
  ```json
  {
    "type": "https://jarvis.local/errors/task-not-found",
    "title": "Task Not Found",
    "status": 404,
    "detail": "Task with ID 'uuid-here' does not exist.",
    "instance": "/api/v1/tasks/uuid-here"
  }
  ```

---

## 2. Core REST Endpoints

### 2.1 System & Health

#### `GET /api/v1/health`
Returns live system health, resource utilization, and component readiness.
- **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "version": "0.1.0-alpha.0",
    "mode": "offline",
    "database": {
      "connected": true,
      "wal_enabled": true,
      "schema_version": "v1.0.0"
    },
    "memory": {
      "total_memories": 142,
      "vault_documents": 12
    },
    "local_ai": {
      "model_loaded": "Llama-3.2-3B-Instruct.Q4_K_M.gguf",
      "runtime": "llama.cpp",
      "device": "cpu"
    },
    "system_resources": {
      "cpu_pct": 14.2,
      "ram_used_mb": 4120,
      "ram_total_mb": 16384
    }
  }
  ```

#### `GET /api/v1/status`
Returns the standardized 10-point project and application status.

---

### 2.2 Universal Command & Task Centre

#### `POST /api/v1/commands/execute`
Submits a raw user command (text or transcribed voice) for planning and execution.
- **Request Body:**
  ```json
  {
    "command": "Search Knowledge Vault for quarterly budget report and summarize key metrics",
    "device_id": "windows-desktop",
    "allow_elevation": false
  }
  ```
- **Response `202 Accepted`:**
  ```json
  {
    "task_id": "8f9a2e6b-1234-5678-90ab-cdef12345678",
    "status": "Queued",
    "risk_level": "Low",
    "requires_approval": false,
    "message": "Task queued for autonomous planning"
  }
  ```

#### `GET /api/v1/tasks`
Lists recent tasks with filtering by status and limit.
- **Query Parameters:** `status` (optional), `limit` (default: 20), `offset` (default: 0).

#### `GET /api/v1/tasks/{id}`
Retrieves detailed task records, decomposed steps, execution output, and audit trail.

#### `POST /api/v1/tasks/{id}/approve`
Explicitly approves a task held in `AwaitingApproval` state.

#### `POST /api/v1/tasks/{id}/cancel`
Safely terminates an active or queued task.

---

### 2.3 Contextual Memory & Knowledge Vault

#### `GET /api/v1/memories`
Queries semantic facts and user preferences with optional category filter.

#### `POST /api/v1/memories`
Creates or updates a persistent memory record.

#### `POST /api/v1/memories/search`
Performs hybrid full-text (FTS5) and semantic vector search across memory entries.
- **Request Body:**
  ```json
  {
    "query": "What are the user's preferred Python linters?",
    "top_k": 5,
    "category": "coding"
  }
  ```

#### `POST /api/v1/vault/documents/index`
Initiates file chunking, hashing, and FTS5 indexing on a local file.

---

### 2.4 Models & AI Providers

#### `GET /api/v1/models/local`
Lists all downloaded local GGUF models on disk with checksum, size, and compatibility metrics.

#### `POST /api/v1/models/local/load`
Loads a selected local model into memory for offline inference.

#### `POST /api/v1/models/local/unload`
Frees system RAM/VRAM by unloading the active model.

---

### 2.5 Backup & Recovery

#### `POST /api/v1/backups/create`
Executes hot SQLite WAL checkpoint and generates an atomic hot snapshot.

#### `GET /api/v1/backups`
Lists all verified local recovery snapshots and metadata.

---

## 3. WebSocket Event Channel (`/ws/events`)

The backend provides a duplex WebSocket channel for real-time frontend reactivity.

### Outgoing Server Events

#### `task.progress`
Streams progress updates as steps complete:
```json
{
  "event": "task.progress",
  "data": {
    "task_id": "8f9a2e6b-...",
    "step_order": 2,
    "total_steps": 4,
    "status": "Running",
    "step_description": "Extracting text slices from quarterly_budget.pdf",
    "progress_pct": 50.0
  }
}
```

#### `voice.state`
Transmits voice state machine transitions and live audio decibel levels:
```json
{
  "event": "voice.state",
  "data": {
    "state": "Listening",
    "db_level": -14.2,
    "wake_word_detected": true
  }
}
```

#### `system.alert`
Broadcasts urgent permission requests or system warnings:
```json
{
  "event": "system.alert",
  "data": {
    "level": "warning",
    "title": "Approval Required",
    "message": "Task requires permission to execute PowerShell script",
    "action_url": "/tasks/8f9a2e6b-..."
  }
}
```
