# ADR 0001: Desktop Presentation and Container Runtime

- **Status:** Accepted
- **Deciders:** Principal Software Architect, Project Owner
- **Date:** 2026-10-26

---

## Context and Problem Statement

JARVIS requires a desktop interface capable of delivering a futuristic, glassmorphic visual aesthetic with dynamic audio reactivity (hologram visualizer), instant responsiveness across 32 pages, and low memory consumption. We evaluated whether to package the desktop shell using Electron or Tauri 2.

---

## Decision Drivers

- Binary size and runtime memory consumption.
- Native Windows 10/11 operating system integration.
- Build capability for producing a single-file installer (`JARVIS-Setup.exe`).
- Modern UI ergonomics (React 19 + TypeScript).

---

## Considered Options

1. **Option 1:** Tauri 2 (Rust host + React 19 / TypeScript / Vite).
2. **Option 2:** Electron (Chromium + Node.js bundle).

---

## Decision Outcome

**Chosen Option: Option 1 — Tauri 2 + React 19 + TypeScript.**

### Positive Consequences
- **Minimal RAM Footprint:** Tauri leverages the Windows WebView2 evergreen runtime already installed on Windows 10 and 11, reducing application base RAM from ~250MB (Electron) to ~35MB.
- **Fast Startup:** Instant cold launch without spinning up a heavy Chromium browser process.
- **Security Boundaries:** Strict Rust capabilities model restricting IPC commands to explicit whitelist endpoints.
- **Single Installer:** Tauri's bundler natively outputs clean NSIS/WiX installers (`JARVIS-Setup.exe`).

### Negative Consequences / Mitigations
- Requires Rust/Cargo toolchain for binary packaging.
- *Mitigation:* The frontend application is scaffolded using Vite and can run directly in local browser development mode (`npm run dev`) during rapid UI development and testing.
