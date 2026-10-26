# CHANGELOG.md — Release History & Version Notes

All notable changes to the **JARVIS** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- **Phase 1:** Core scaffolding for Python/FastAPI backend, SQLite persistence, React 19 desktop UI, and Android project skeleton.
- **Phase 2:** Design token system and 32 functional dashboard pages.
- **Phase 3:** Provider registry, local GGUF model loader, and offline voice state machine.
- **Phase 4:** Contextual memory service and Knowledge Vault FTS5 indexer.
- **Phase 5:** Autonomous task planner and multi-agent execution engine.

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
