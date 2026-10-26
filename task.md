# TASK.md — Canonical Task Tracking Register

This document tracks all discrete development tasks, dependencies, verification evidence, and completion status across the **JARVIS** project lifecycle.

---

## Task Summary Dashboard

| Status | Count |
|---|---|
| **Completed** | 1 |
| **In Progress** | 1 |
| **Pending / Queued** | 9 |
| **Blocked** | 0 |
| **Total Tasks** | 11 |

---

## Active & Historical Tasks

### [TSK-000] Phase 0: Project Inspection & Canonical Documentation
- **Feature ID:** `FEAT-P0-INIT`
- **Priority:** Critical
- **Status:** In Progress
- **Dependencies:** None
- **Implementation Notes:** Inspect existing environment (Node, npm, Python, Git, Cargo). Initialize Git repository. Create master documentation suite per PRD Part 7.
- **Acceptance Criteria:**
  - [x] Environment inspection complete.
  - [x] Git repository initialized with `main` branch.
  - [x] Canonical documentation created (`AGENTS.md`, `README.md`, `ARCHITECTURE.md`, `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, `task.md`, `memory.md`, `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `RELEASE.md`, `API.md`, `.gitignore`, `.editorconfig`, `.env.example`, ADRs, CI).
  - [ ] Phase 0 documentation committed to Git.
- **Files Changed:**
  - `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, `task.md`, `memory.md`, `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `RELEASE.md`, `API.md`, `.gitignore`, `.editorconfig`, `.env.example`
- **Tests Run:**
  - PowerShell dev tools inspection: Node `v24.18.0`, npm `11.16.0`, Python `3.12.10`, Git `2.42+`.
- **Evidence:** Terminal execution logs in conversation transcript.
- **Blockers:** None.
- **Next Action:** Complete remaining documentation files and commit Phase 0 baseline.

---

### [TSK-001] Phase 1: Python/FastAPI Backend Scaffolding
- **Feature ID:** `FEAT-P1-BACKEND`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-000`
- **Implementation Notes:** Scaffold `backend/` with `pyproject.toml`, FastAPI application entrypoint, Pydantic v2 configuration, and structured logging.
- **Acceptance Criteria:**
  - Backend package installable via `pip install -e .`.
  - Application boots and serves at `http://127.0.0.1:8000`.
  - Health check endpoint `/api/v1/health` returns valid JSON with system status.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.
- **Blockers:** None.
- **Next Action:** Create `backend/pyproject.toml` and core app structure.

---

### [TSK-002] Phase 1: SQLite Persistence Engine & Baseline Migration
- **Feature ID:** `FEAT-P1-DB`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-001`
- **Implementation Notes:** Configure SQLite database engine with WAL mode and initial schema migration framework (`data.md`).
- **Acceptance Criteria:**
  - WAL mode enabled and verified.
  - Tables `tasks`, `memories`, `providers`, `vault_documents`, `audit_logs` created.
  - Automated test verifies database initialization and teardown.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.
- **Blockers:** None.
- **Next Action:** Implement `backend/src/jarvis/database`.

---

### [TSK-003] Phase 1: React 19 + TypeScript Desktop Frontend Scaffolding
- **Feature ID:** `FEAT-P1-FRONTEND`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-000`
- **Implementation Notes:** Scaffold `apps/desktop/` with Vite, React 19, strict TypeScript, and router.
- **Acceptance Criteria:**
  - `npm install` and `npm run build` pass cleanly without type errors.
  - Development server runs at `http://localhost:5173`.
  - Frontend connects to `/api/v1/health` endpoint.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.
- **Blockers:** None.
- **Next Action:** Initialize Vite app in `apps/desktop`.

---

### [TSK-004] Phase 1: Tauri 2 Desktop Shell Configuration
- **Feature ID:** `FEAT-P1-TAURI`
- **Priority:** Medium
- **Status:** Pending
- **Dependencies:** `TSK-003`
- **Implementation Notes:** Configure `apps/desktop/src-tauri/` manifests and permissions for Windows packaging.
- **Acceptance Criteria:**
  - Tauri config files validated.
  - IPC boundaries established.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.
- **Blockers:** Cargo toolchain installation needed for binary compilation.
- **Next Action:** Setup `tauri.conf.json` and Rust host files.

---

### [TSK-005] Phase 1: Android Mobile Project Skeleton
- **Feature ID:** `FEAT-P1-ANDROID`
- **Priority:** Medium
- **Status:** Pending
- **Dependencies:** `TSK-000`
- **Implementation Notes:** Scaffold `apps/android/` with Gradle, Kotlin 2.x, and Jetpack Compose.
- **Acceptance Criteria:**
  - Gradle build configuration compiles cleanly.
  - Main activity renders onboarding screen.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.
- **Blockers:** None.
- **Next Action:** Setup Gradle structure in `apps/android`.

---

### [TSK-006] Phase 2: Design System & 32-Page Layout Architecture
- **Feature ID:** `FEAT-P2-UI`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-003`
- **Implementation Notes:** Implement dark glassmorphism design tokens and build all 32 functional dashboard pages.
- **Acceptance Criteria:** All 32 pages route cleanly with real state and non-mocked UI components.
- **Files Changed:** None yet.
- **Tests Run:** Pending.
- **Evidence:** Pending.

---

### [TSK-007] Phase 3: Provider Registry & Voice State Machine
- **Feature ID:** `FEAT-P3-VOICE`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-001`, `TSK-002`
- **Implementation Notes:** Implement local GGUF/llama.cpp inference and offline voice state machine.
- **Acceptance Criteria:** Voice states transition cleanly; local model runs inference offline.

---

### [TSK-008] Phase 4: Contextual Memory, FTS5 & Knowledge Vault
- **Feature ID:** `FEAT-P4-MEMORY`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-002`
- **Implementation Notes:** Ingest local files, create FTS5 index, and provide persistent semantic memory.
- **Acceptance Criteria:** Documents indexed and retrieved with sub-second latency.

---

### [TSK-009] Phase 5: Task Orchestration & Multi-Agent Engine
- **Feature ID:** `FEAT-P5-ORCHESTRATION`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-001`, `TSK-007`
- **Implementation Notes:** Autonomous multi-step task execution, streaming WebSocket telemetry, and pause/resume.
- **Acceptance Criteria:** Multi-step autonomous task completes with audit trail.

---

### [TSK-010] Phase 6–10: Desktop Control, Android Native, Packaging & Release
- **Feature ID:** `FEAT-P6-P10-RELEASE`
- **Priority:** High
- **Status:** Pending
- **Dependencies:** `TSK-006`, `TSK-009`
- **Implementation Notes:** Packaging `JARVIS-Setup.exe` and `JARVIS.apk`, and 12-step offline acceptance test.
- **Acceptance Criteria:** Standalone single-file installers built and verified.
