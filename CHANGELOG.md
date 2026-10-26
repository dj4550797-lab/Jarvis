# CHANGELOG.md — Release History & Version Notes

All notable changes to the **JARVIS** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - Phase 1: Foundation & Core Scaffolding
- **Core Backend Engine (`backend/`):**
  - Scaffolded Python 3.12 package installed in editable virtual environment.
  - Implemented Pydantic v2 configuration management with environment loader.
  - Built structured logging with sensitive token / API key regex redaction.
  - Developed async `EventBus` pub/sub dispatcher for streaming events.
  - Implemented SQLite persistence layer with WAL mode (`PRAGMA journal_mode=WAL`), foreign keys, busy timeout, and v1.0.0 schema migrations.
  - Created FTS5 full-text search virtual tables (`memories_fts`, `document_chunks_fts`).
  - Built REST API endpoints: `/api/v1/health`, `/api/v1/status`, `/api/v1/tasks`, `/api/v1/memories`.
  - Built WebSocket gateway: `/ws/events` forwarding real-time system and task events.
  - Verified backend test suite: 8 passing unit and integration tests via pytest.
- **Desktop UI Layer (`apps/desktop/`):**
  - Scaffolded React 18/19, TypeScript (strict), and Vite application.
  - Implemented dark cyber-glass design token system (`index.css`).
  - Built 3D particle canvas Hologram visualizer with dynamic audio reactivity.
  - Created TopNav with live system telemetry (CPU, RAM, SQLite status, mode badge).
  - Built CommandBar with voice toggle, elevation checkbox, and keyboard execution.
  - Implemented Page 1 Home Dashboard with real task operations table and cancellation.
  - Built typed REST and auto-reconnecting WebSocket clients.
  - Verified production bundle compilation: 1577 modules transformed, zero type errors.
- **Tauri 2 Shell Container (`apps/desktop/src-tauri/`):**
  - Configured `tauri.conf.json`, `Cargo.toml`, and `src/main.rs`.
- **Android Mobile Companion (`apps/android/`):**
  - Configured Gradle KTS multi-project, `AndroidManifest.xml` permissions, and Jetpack Compose `MainActivity.kt`.

---

## [0.1.0-alpha.0] — 2026-10-26

### Added
- **Phase 0 — Repository Audit & Planning:**
  - Initialized Git repository on `main` branch.
  - Audited local host toolchains: verified Node.js v24.18.0, npm 11.16.0, Python 3.12.10, and Git.
  - Established Master PRD alignment and Zero-Fabrication rule.
  - Created canonical documentation suite:
    - `AGENTS.md`: Mandatory agent behavioral contract and command protocol.
    - `README.md`: Architectural overview, setup instructions, and quick start.
    - `ARCHITECTURE.md`: Tripartite runtime, Mermaid sequence/state diagrams, and security boundaries.
    - `implement_plan.md`: Phased roadmap, dependency graph, and acceptance gates.
    - `workflow.md`: Development, test, build, and interruption recovery workflows.
    - `data.md`: SQLite schema definitions, FTS5 indexes, encryption boundaries, and migrations.
    - `test.md`: Testing strategy, test inventory, and 12-step offline acceptance protocol.
    - `task.md`: Canonical task tracking register.
    - `memory.md`: Continuity memory and project state for coding agents.
    - `SECURITY.md`: Threat model, risk tiers, elevation gates, and vulnerability reporting.
    - `PRIVACY.md`: Local-first sovereignty guarantees and data shredding controls.
    - `CHANGELOG.md`: Version tracking.
    - `CONTRIBUTING.md`: Development guidelines and PR standards.
    - `TROUBLESHOOTING.md`: Diagnostic procedures and environment problem resolutions.
    - `RELEASE.md`: Release verification gates and packaging requirements.
    - `API.md`: Service contracts for REST and WebSocket interfaces.
    - Architectural Decision Records: `ADR/0001-desktop-runtime.md`, `ADR/0002-backend-runtime.md`, `ADR/0003-memory-and-backup.md`.
    - Project configuration files: `.gitignore`, `.editorconfig`, `.env.example`, `.github/workflows/ci.yml`.
