# MEMORY.md — Canonical Continuity Record for Coding Agents

**Project Name:** JARVIS  
**Document Type:** Agent Memory & Continuity Record  
**Last Updated:** 2026-10-26T20:12:00+05:30  
**Current Phase:** Phase 0 — Repository Audit & Planning  
**Active Branch:** `main`  
**Schema Version:** v1.0.0 (Initial Draft)

---

## 1. Project Identity & High-Level Directives

JARVIS is an autonomous personal AI assistant for Windows desktop and Android mobile devices.
- **Operating Modes:** Dual-mode design — strictly enforced Local/Offline Mode (llama.cpp/GGUF, local speech, local SQLite FTS5 & vector search, zero external API leakage) and Online/Hybrid Mode (optional cloud providers when authorized).
- **Core Stacks:**
  - Desktop Frontend: React 19, TypeScript (strict), Vite, Tailwind/Vanilla design tokens.
  - Desktop Container: Tauri 2 with Rust.
  - Core Backend: Python 3.12, FastAPI, Pydantic v2, SQLite (WAL mode).
  - Android Client: Kotlin, Jetpack Compose, Room.
- **Deliverables:** Standalone single-file Windows installer (`JARVIS-Setup.exe`) and single installable Android APK (`JARVIS.apk`).
- **Zero-Fabrication Contract:** No non-functional buttons, fake progress bars, canned mock responses, or fabricated provider statuses.

---

## 2. Repository Structure Summary

```text
jarvis/
├── AGENTS.md                  # Strict agent operational contract
├── README.md                  # Project overview & developer guide
├── PRD.md                     # Master requirements document (v1.0.0)
├── ARCHITECTURE.md            # System architecture, state machine & diagrams
├── implement_plan.md          # Phased roadmap & acceptance criteria
├── workflow.md                # Development, test, build & recovery workflows
├── data.md                    # Database entities, FTS5 indexes & migration rules
├── test.md                    # Test strategies, commands & verification log
├── task.md                    # Canonical task tracking register
├── memory.md                  # Continuity memory & project state (this file)
├── SECURITY.md                # Threat model & security boundaries
├── PRIVACY.md                 # Local-first privacy guarantees
├── CHANGELOG.md               # Version history and release notes
├── CONTRIBUTING.md            # Contribution guidelines & zero-fabrication rules
├── TROUBLESHOOTING.md         # Diagnostics & resolution procedures
├── RELEASE.md                 # Release gates & packaging specifications
├── API.md                     # REST & WebSocket service contracts
├── .gitignore                 # Exclusions for secrets, builds, DBs, models
├── .editorconfig              # Whitespace and formatting consistency
├── .env.example               # Configuration template
├── ADR/                       # Architectural Decision Records
│   ├── 0001-desktop-runtime.md
│   ├── 0002-backend-runtime.md
│   └── 0003-memory-and-backup.md
├── .github/workflows/ci.yml   # Initial CI pipeline
├── apps/
│   ├── desktop/               # [Phase 1 Target] React 19 + Tauri 2
│   └── android/               # [Phase 1 Target] Kotlin + Jetpack Compose
└── backend/                   # [Phase 1 Target] Python 3.12 + FastAPI
```

---

## 3. Current Implementation Status

### Completed Verified Work
- Completed comprehensive project inspection:
  - Verified Node.js: `v24.18.0`
  - Verified npm: `11.16.0`
  - Verified Python: `3.12.10`
  - Verified Git: `2.42+` (initialized repository on branch `main`)
- Created canonical documentation suite:
  - `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, `task.md`, `memory.md`, `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `RELEASE.md`, `API.md`.
  - `.gitignore`, `.editorconfig`, `.env.example`.

### Work In Progress
- Finalizing Phase 0 documentation baseline commit and CI/ADR files.

### Remaining Work
- **Phase 1:** Backend FastAPI setup, SQLite persistence with migrations, React 19 desktop scaffolding, Android skeleton.
- **Phase 2:** Design token system and complete 32-page dashboard layout.
- **Phase 3:** Provider registry and offline voice state machine.
- **Phase 4:** Contextual memory, FTS5 search, and knowledge vault.
- **Phase 5:** Autonomous task planner and multi-agent engine.
- **Phases 6–10:** OS control, Android companion, self-development lab, packaging, and offline acceptance test.

---

## 4. Key Architectural Decisions (ADR Summary)

1. **ADR-0001 (Desktop Runtime):** Adopted React 19 + TypeScript inside Tauri 2 over Electron for minimum memory footprint, fast startup, and native Windows API integration.
2. **ADR-0002 (Backend Runtime):** Adopted Python 3.12 + FastAPI over Node.js backend for native AI model bindings (llama.cpp, PyTorch, PyAutoGUI, Windows OCR) and robust async I/O.
3. **ADR-0003 (Local Persistence):** Adopted SQLite with WAL mode, FTS5 full-text indexing, and AES-256-GCM column encryption over client-server databases for zero-configuration, zero-dependency offline resilience.

---

## 5. Known Issues, Limitations & Blockers

1. **Cargo / Rust Toolchain:** `cargo` is not yet installed in system PATH. Tauri binary builds are deferred until Rust is installed; frontend is developed and tested as a Vite web application with Tauri capabilities mocked or staged.
2. **Offline Weights:** AI model weights (`.gguf`) are excluded from Git to prevent repository bloat; an in-app download manager will handle local model acquisition.

---

## 6. Verification & Test Evidence

- **2026-10-26:** Host environment audit executed via PowerShell. Results: Node v24.18.0, npm 11.16.0, Python 3.12.10 verified. Git repository initialized at `E:\Jarvis\.git`.

---

## 7. Exact Next Action

1. Complete `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `RELEASE.md`, `API.md`, ADRs, and `.github/workflows/ci.yml`.
2. Commit Phase 0 documentation to `main`.
3. Launch Phase 1 foundation scaffolding: initialize `backend/` with `pyproject.toml` and FastAPI health endpoints.
