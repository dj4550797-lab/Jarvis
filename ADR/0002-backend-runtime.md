# ADR 0002: Backend Runtime & Service Framework

- **Status:** Accepted
- **Deciders:** Principal Software Architect, Project Owner
- **Date:** 2026-10-26

---

## Context and Problem Statement

JARVIS acts as the central brain orchestrating local on-device AI inference, speech processing, screen capture, OCR, SQLite persistence, and external model routing. We evaluated runtime environments for the core service layer.

---

## Decision Drivers

- Native bindings to local AI runtimes (e.g., `llama-cpp-python`, PyTorch, ONNX).
- Windows desktop automation libraries (e.g., `pywin32`, `pyautogui`, Windows Media OCR).
- High-performance asynchronous API framework supporting both REST and duplex WebSockets.
- Strong typing and strict data validation schemas.

---

## Considered Options

1. **Option 1:** Python 3.12 + FastAPI + Pydantic v2.
2. **Option 2:** Node.js + Express / Fastify + TypeScript.
3. **Option 3:** Pure Rust backend (Actix / Axum).

---

## Decision Outcome

**Chosen Option: Option 1 — Python 3.12 + FastAPI + Pydantic v2.**

### Positive Consequences
- **Ecosystem Dominance in AI:** Direct first-class support for GGUF model runners, speech recognition (Faster-Whisper), and computer vision pipelines without cumbersome subprocess wrappers.
- **FastAPI Capabilities:** High-throughput async event loop with automatic OpenAPI documentation generation and native WebSocket support.
- **Pydantic v2:** High-speed C-based validation ensuring strict type-safety across all internal and external boundaries.

### Negative Consequences / Mitigations
- Requires bundling a redistributable Python runtime with the Windows installer.
- *Mitigation:* Use PyInstaller / PyOxidizer or embedded portable Python during release packaging to make it completely invisible to the end user.
