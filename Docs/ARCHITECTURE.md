# ARCHITECTURE.md — System Architecture & Component Specifications

This document specifies the technical architecture, component boundaries, execution flows, and integration interfaces for **JARVIS**.

---

## 1. System Overview

JARVIS is architected as an asynchronous, local-first personal assistant with a decoupled tripartite runtime:
1. **Desktop Presentation & Container Layer:** React 19 + TypeScript encapsulated within a Tauri 2 (Rust) desktop shell.
2. **Core Brain & Service Layer:** Python 3.12 + FastAPI backend serving persistent business logic, task scheduling, local/cloud AI orchestration, and system automation adapters.
3. **Android Native Mobile Layer:** Kotlin + Jetpack Compose application with on-device local capabilities and authenticated synchronization with the shared brain.

```mermaid
graph TD
    subgraph Client Layer
        WebUI[React 19 Frontend<br/>TypeScript / TailwindCSS / Vite]
        TauriShell[Tauri 2 Rust Host<br/>Native Windows APIs]
        AndroidApp[Android Client<br/>Kotlin / Jetpack Compose]
    end

    subgraph Core Brain - Python FastAPI Backend
        API[FastAPI Gateway<br/>REST & WebSockets]
        Router[Provider & Model Router<br/>Local GGUF vs Cloud]
        TaskEngine[Task State Machine<br/>& Autonomous Planner]
        MemoryService[Memory & Vault Service<br/>FTS5 & Vector Store]
        Automation[Desktop Automation Adapters<br/>Win32 / PyAutoGUI / Screen OCR]
    end

    subgraph Data & Storage
        SQLite[(SQLite Database<br/>WAL Mode & Schema Migrations)]
        ModelStore[Local Models Directory<br/>GGUF / Checksums]
        VaultStorage[Encrypted Knowledge Files<br/>Local File Vault]
    end

    WebUI <-->|WebSocket / REST| API
    TauriShell -.->|Native Bridge| WebUI
    AndroidApp <-->|Authenticated Sync REST| API

    API --> Router
    API --> TaskEngine
    API --> MemoryService
    API --> Automation

    TaskEngine --> SQLite
    MemoryService --> SQLite
    MemoryService --> VaultStorage
    Router --> ModelStore
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Desktop Client (`apps/desktop`)
- **Technology:** React 19, TypeScript (strict mode), Vite, Lucide Icons, Vanilla/Tailwind CSS design tokens.
- **Role:** High-performance responsive presentation layer hosting all 32 functional dashboard views, hologram audio visualization, real-time command feedback, and settings management.
- **State Management:** Lightweight React state with query caching for server resources, and WebSocket subscriptions for live task logs, voice waveforms, and health metrics.
- **Tauri Shell:** Provides minimal privileged native boundaries (system tray, window chrome, low-level hotkeys) without cluttering frontend logic.

### 2.2 Core Backend (`backend/src/jarvis`)
- **Technology:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy/aiosqlite.
- **Sub-modules:**
  - `api/`: REST endpoints and WebSocket handlers with explicit request/response schemas.
  - `core/`: Application lifecycle, settings loading, event bus, and structured logging.
  - `database/`: Database connection management, SQLite WAL mode configuration, and migration runner.
  - `models/`: SQLAlchemy ORM entity definitions.
  - `schemas/`: Pydantic validation models for all API boundaries.
  - `services/`: Encapsulated domain logic for Tasks, Memories, Vault, Providers, and Diagnostics.
  - `providers/`: Modular provider adapters:
    - `LocalEngine`: llama.cpp / GGUF runner for zero-API offline operation.
    - `CloudEngines`: OpenAI, Anthropic, Gemini, Groq, Ollama adapters.
  - `platform/`: Windows-specific native integrations (Win32 API, screen capture, OCR, audio I/O).
  - `automation/`: Browser automation (Playwright/Selenium), keyboard/mouse scripting, and app launcher.
  - `recovery/`: Local backup generation, cryptographic hashing, and restore operations.

### 2.3 Android Client (`apps/android`)
- **Technology:** Kotlin 2.x, Jetpack Compose, Room persistence, Coroutines & Flow.
- **Role:** Native Android companion providing voice interactions, device controls (contacts, alarms, notifications), accessibility-enabled UI automation, and secure sync with the JARVIS brain.
- **Single APK Requirement:** Self-contained build packaging native code, assets, and optional download manager for on-device MediaPipe/ML Kit runtimes.

---

## 3. Data Flow & Execution Pathways

### 3.1 Command Ingestion & Processing

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Desktop / Android UI
    participant Gateway as FastAPI Gateway
    participant Router as Model & Policy Router
    participant Engine as Task Execution Engine
    participant SQLite as SQLite Storage

    User->>UI: Speaks or types command
    UI->>Gateway: POST /api/v1/commands/execute
    Gateway->>SQLite: Insert Task (State: Queued)
    Gateway->>Router: Analyze intent & policy check
    
    alt Policy requires approval (High Risk)
        Router-->>Gateway: Risk Level High
        Gateway->>SQLite: Update Task (State: Awaiting Approval)
        Gateway-->>UI: Require Confirmation Prompt
        User->>UI: Approves execution
        UI->>Gateway: POST /api/v1/tasks/{id}/approve
    end

    Gateway->>Engine: Dispatch Task Plan
    Engine->>SQLite: Update Task (State: Running)
    Engine->>UI: Stream live progress events via WebSocket
    Engine->>Engine: Execute automation / tool calls
    Engine->>SQLite: Record execution evidence & results
    Engine->>SQLite: Update Task (State: Completed)
    Engine-->>UI: Final execution report & audit trail
```

### 3.2 Dual Operating Modes (Offline vs. Hybrid)

```mermaid
flowchart TD
    Request[User Query / Task] --> CheckMode{Operating Mode?}
    
    CheckMode -- "Local / Offline Mode" --> CheckLocalModel{Local Model Loaded?}
    CheckLocalModel -- Yes --> LocalInference[Local llama.cpp Engine<br/>Zero Network Outbound]
    CheckLocalModel -- No --> OfflineError[Return Clear Error:<br/>No Local Model Available]
    
    CheckMode -- "Online / Hybrid Mode" --> CheckNet{Internet & Key Available?}
    CheckNet -- Yes --> CloudProvider[Cloud AI Provider<br/>OpenAI / Anthropic / Gemini]
    CheckNet -- No --> FallbackNotice{Cloud Fallback Allowed?}
    FallbackNotice -- Yes --> LocalInference
    FallbackNotice -- No --> NetworkError[Return Network Error]
```

---

## 4. Task State Machine

Tasks are durable and strictly adhere to the state transition contract defined below:

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Queued: Submit
    Draft --> AwaitingApproval: Requires Elevation
    AwaitingApproval --> Queued: User Approves
    AwaitingApproval --> Cancelled: User Denies
    
    Queued --> Running: Worker Claims Lease
    Running --> Paused: User / System Pause
    Paused --> Running: Resume
    
    Running --> Completed: All Steps Verified
    Running --> PartiallyCompleted: Non-fatal Step Failed
    Running --> Failed: Execution Error
    Running --> Blocked: Missing Prerequisite
    Running --> Cancelled: User Cancel
    
    Completed --> [*]
    Failed --> [*]
    Cancelled --> [*]
```

---

## 5. Security & Isolation Boundaries

1. **Local-First Boundary:** All memories, user files, credentials, and conversation transcripts reside in local encrypted or access-restricted SQLite files.
2. **Zero-API Mode Guarantee:** When `JARVIS_OFFLINE_MODE=true` is enabled, the model router strictly disables outbound network calls to third-party AI endpoints.
3. **Approval Gates for Elevated Actions:** Desktop file deletions, OS command executions, and browser purchases require explicit interactive approval prompts.
4. **Audit Logging:** Every command execution, risk assessment, and tool invocation creates an immutable record in the `audit_logs` table.
