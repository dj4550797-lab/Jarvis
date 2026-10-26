# JARVIS — Autonomous Personal AI Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Platform: Windows | Android](https://img.shields.io/badge/Platform-Windows%20%7C%20Android-brightgreen.svg)](#platforms)
[![Mode: Local Offline | Online Hybrid](https://img.shields.io/badge/Mode-Local%20Offline%20%7C%20Online%20Hybrid-purple.svg)](#offline-first-architecture)

JARVIS is a private, autonomous personal AI assistant engineered for Windows desktop and Android mobile devices. It unifies natural conversational intelligence, persistent contextual memory, dynamic model routing, offline on-device AI inference, computer interaction, workflow automation, and cross-device task synchronization into a cohesive, secure ecosystem.

---

## Key Capabilities

- **Zero-API Local / Offline Mode:** Full offline functionality without internet or third-party cloud API keys. Integrates local GGUF/llama.cpp inference, local speech recognition, and on-device SQLite vector search.
- **Online / Hybrid Expansion:** Secure integration with cloud providers (OpenAI, Anthropic, Gemini, Groq, Ollama) when authorized, with strict cloud-fallback exclusion controls.
- **Persistent Contextual Memory & Knowledge Vault:** SQLite-backed personal memory, document indexing, semantic retrieval, and knowledge graphs with complete user export and deletion rights.
- **Universal Command Centre:** Natural language execution engine for computer automation, browser workflows, file management, and long-running autonomous project tasks.
- **Futuristic & Premium Interface:** Hologram visualizer, audio reactive feedback, dark glassmorphism styling, and streamlined navigation across 32 comprehensive operational views.
- **Single-File Deliverables:**
  - **Windows Desktop:** Standalone `JARVIS-Setup.exe` installer with redistributable runtimes.
  - **Android Mobile:** Single universal installable `JARVIS.apk` built with Kotlin and Jetpack Compose.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │            Shared Brain              │
                      │  SQLite DB • State • Vector Memory   │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │      Windows Desktop      │                   │      Android Mobile       │
   ├───────────────────────────┤                   ├───────────────────────────┤
   │ UI: React 19 + TypeScript │                   │ UI: Jetpack Compose       │
   │ Shell: Tauri 2 (Rust)     │                   │ Engine: Kotlin Native     │
   │ Backend: Python + FastAPI │                   │ Storage: Room / SQLite    │
   │ Local AI: llama.cpp / GGUF│                   │ On-device AI: MediaPipe   │
   └───────────────────────────┘                   └───────────────────────────┘
```

---

## Project Structure

```text
jarvis/
├── AGENTS.md                  # Strict coding agent operational protocol
├── README.md                  # Project overview & developer guide
├── JARVIS.exe                 # Standalone double-clickable Windows test executable (17.0 MB)
├── Docs/                      # Canonical documentation suite
│   ├── PRD.md                 # Master Product Requirements Document
│   ├── ARCHITECTURE.md        # Technical architecture & design specifications
│   ├── implement_plan.md      # Phased roadmap & execution plan
│   ├── memory.md              # Continuity memory & project state for agents
│   ├── task.md                # Canonical task tracking register
│   ├── test.md                # Test strategies, suites & verification records
│   ├── workflow.md            # Development, build, test & recovery workflows
│   ├── data.md                # Data schemas, database entities & migrations
│   ├── SECURITY.md            # Threat model, credential boundaries & policies
│   ├── PRIVACY.md             # Local-first privacy guarantees & data policies
│   ├── CHANGELOG.md           # Version history and change notes
│   ├── API.md                 # REST & WebSocket endpoint documentation
│   └── RELEASE.md             # Packaging and release gates
├── apps/
│   ├── desktop/               # React 19 + TypeScript frontend & Tauri 2 shell
│   └── android/               # Kotlin + Jetpack Compose mobile application
├── backend/                   # Python 3.12 + FastAPI core service layer
└── .github/                   # GitHub Actions CI/CD workflows
```

---

## Prerequisites

- **Node.js:** v20+ (Detected: `v24.18.0`)
- **npm:** v10+ (Detected: `11.16.0`)
- **Python:** 3.11+ (Detected: `3.12.10`)
- **Git:** Installed and configured
- **Rust & Cargo:** (Required for Tauri release packaging)
- **Android SDK & JDK 17:** (Required for Android APK builds)

---

## Quick Start (Development)

### 1. Backend Service
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn jarvis.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Desktop Frontend
```powershell
cd apps/desktop
npm install
npm run dev
```

### 3. Desktop Tauri Container
```powershell
cd apps/desktop
npm run tauri dev
```

---

## Testing & Verification

Run verified automated tests across backend and frontend:

```powershell
# Run backend unit and integration tests
pytest backend/tests -v

# Run frontend unit tests and type checks
cd apps/desktop
npm run test
npm run typecheck
```

---

## Agent Operational Commands

When working with pair programming agents (Antigravity, Claude Code), use the standardized command suite:

- `/status` — Generate 10-point project health and milestone report.
- `/plan` — Review and update implementation roadmap in `implement_plan.md`.
- `/task` — Inspect or update tasks in `task.md`.
- `/memory` — Verify and synchronize context in `memory.md`.
- `/test` — Execute automated test suites.
- `/release-check` — Verify release gates against the PRD Definition of Done.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
