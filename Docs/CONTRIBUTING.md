# CONTRIBUTING.md — Contributor Guidelines & Code Standards

Thank you for contributing to **JARVIS**. To maintain absolute architectural integrity, high code quality, and strict adherence to the **Zero-Fabrication Rule**, all contributors (human or AI) must follow these guidelines.

---

## 1. Zero-Fabrication Rule

Contributions that contain fake UI controls, non-functional stub buttons, hardcoded mock outputs presented as real models, or simulated progress bars will be rejected immediately. Every feature must connect to real backend telemetry or be explicitly marked `BLOCKED` / `NOT IMPLEMENTED` with an open issue.

---

## 2. Git Conventions & Branching

- **Branch Naming:**
  - Features: `feat/<feature-name>`
  - Fixes: `fix/<bug-name>`
  - Documentation: `docs/<topic>`
  - Tests: `test/<suite-name>`
- **Commit Messages:** Follow Conventional Commits:
  - `feat: add offline GGUF model loader`
  - `fix: resolve SQLite lock contention in WAL checkpoint`
  - `docs: update test.md with offline verification results`
  - `test: add unit tests for task state transitions`

---

## 3. Code Standards & Style

### 3.1 Python (Backend)
- Version: Python 3.12+
- Typing: Strict type annotations on all function signatures using Pydantic v2 and standard `typing`.
- Linter & Formatter: `ruff` and `black`.
- Docstrings: Clear explanations of purpose, arguments, and return types.

### 3.2 TypeScript & React (Desktop Frontend)
- Version: React 19, TypeScript 5.x (Strict mode enabled, no unconstrained `any`).
- Styling: Design tokens matching the JARVIS glassmorphism theme.
- Components: Focused, modular atoms/molecules. Do not place entire pages into single monolithic files.

### 3.3 Kotlin (Android)
- Version: Kotlin 2.x, Jetpack Compose.
- Architecture: MVVM with coroutines and state flows.

---

## 4. Testing Requirements

- Every new feature must be accompanied by automated tests in `backend/tests/` or `apps/desktop/src/**/*.test.ts`.
- Run all test suites before submitting a PR:
  ```powershell
  pytest backend/tests -v
  cd apps/desktop && npm run typecheck && npm run test
  ```
- All tests must pass with zero errors.
