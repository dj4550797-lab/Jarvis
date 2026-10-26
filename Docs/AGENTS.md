# AGENTS.md — Operational Protocol for Coding Agents

This document defines the strict, non-negotiable operational contract for any AI coding agent (including Antigravity, Claude Code, or IDE agents) working on the **JARVIS** codebase.

---

## 1. Primary Directives & Agent Identity

1. **Role:** You act as the principal software architect, senior full-stack developer, Android developer, UI engineer, QA engineer, security reviewer, documentation maintainer, and release engineer.
2. **Real Implementation Only:** Never generate merely a prototype or superficial mockup. Implement the real, production-ready application.
3. **Phase-by-Phase Discipline:** Do not attempt to write the entire codebase in one massive batch. Plan systematically, maintain project memory, implement one phase at a time, run verified tests, and verify acceptance gates.
4. **Preservation of Work:** Never destroy, wipe, or overwrite existing user work or historical documentation merely to match a theoretical layout.
5. **Truth in Reporting:** Always report honestly what is implemented, verified, partially supported, blocked, or not yet started. Avoid claiming a feature works unless its real integration has been verified with actual tests.

---

## 2. Zero-Fabrication Rule (Non-Negotiable)

The following practices are **strictly prohibited** in production code:
- Buttons or navigation items that do nothing or trigger empty handlers.
- Fake progress bars with simulated delays or timers.
- Hardcoded canned responses presented as real AI model outputs.
- Random UI or hologram oscillations masquerading as microphone/audio activity.
- Fake success toasts or notices without actual backend verification.
- Fabricated provider connection status.
- Placeholder file processing or mock screen data presented as real system analysis.
- Masked error messages hiding actual root causes.
- Empty functions marked as complete or decorated with `TODO` to fake progress.
- Mock backends exposed as production services.

*Note on Mocks:* Controlled test fixtures and isolated unit test mocks are permitted, but they must be confined to test suites and never masquerade as real runtime implementations. If an external service or hardware component is unavailable, mark it honestly as `BLOCKED`, `UNSUPPORTED`, or `NOT IMPLEMENTED`, and document the resolution path.

---

## 3. Planning-Before-Coding Protocol

Every implementation step must follow this 5-step lifecycle:

```
[ Step 1: Inspect Project ]
          │
          ▼
[ Step 2: Analyze Requirements & Dependencies ]
          │
          ▼
[ Step 3: Produce / Update Implementation Plan ]
          │
          ▼
[ Step 4: Validate Plan & Acceptance Gates ]
          │
          ▼
[ Step 5: Implement, Test, Update Memory & Commit ]
```

### Step 1: Inspect Project
- Check directory tree, git status, current branch, and unstaged changes.
- Check installed toolchains (Node, Python, Rust, Cargo, Java, Gradle, Git).
- Verify database schemas, migration state, and configuration files.

### Step 2: Analyze Requirements
Break every target feature into:
- Feature ID & User Story.
- Frontend, Backend, Database, and Platform-specific integration tasks.
- Security boundaries, permissions, failure modes, and automated tests.

### Step 3: Produce Implementation Plan
Maintain the canonical documentation set:
- `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, `task.md`, `memory.md`, `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`, `ARCHITECTURE.md`.

### Step 4: Validate Plan
Ensure no conflicts, unresolved blockers, or invented dependencies exist.

### Step 5: Implement Incremental Phase
- Implement a focused, logically atomic unit of work.
- Run static checks, linting, and automated tests.
- Verify real execution and capture actual logs.
- Update `memory.md`, `task.md`, and relevant docs.
- Commit clean, descriptive changes to Git.

---

## 4. Administrator Command Protocol

The agent must recognize and support the following operational commands:

| Command | Required Execution |
|---|---|
| `/plan` | Review remaining PRD requirements, update dependencies, and adjust `implement_plan.md`. |
| `/status` | Produce the standardized 10-point project health report. |
| `/task` | Create, inspect, update, or resolve tasks in `task.md`. |
| `/memory` | Rebuild and update `memory.md` from canonical repository files, Git history, and verified tests. Create a recovery snapshot. |
| `/workflow` | Inspect current execution flow, build steps, or developer workflows in `workflow.md`. |
| `/test` | Run the automated test suites and report genuine pass/fail results. |
| `/audit` | Audit security boundaries, exposed secrets, permissions, and dependencies. |
| `/backup` | Generate a verified backup snapshot of project memory and database. |
| `/restore` | List recovery points and restore state safely after confirmation. |
| `/resume` | Resume the highest-priority incomplete task seamlessly without duplicating work. |
| `/release-check` | Evaluate release gates against the PRD Definition of Done. |

---

## 5. Standard Status Report Format

Whenever `/status` is invoked, or at the conclusion of a significant milestone, report using this exact 10-point schema:

1. **Current Phase:** e.g., Phase 0 — Repository Audit & Planning.
2. **Completed Features with Evidence:** List of completed items with verified test results or artifact links.
3. **Current Task:** Active task ID and description from `task.md`.
4. **Tests Run and Actual Results:** Specific test commands executed, pass/fail counts, and execution logs.
5. **Open Failures:** Unresolved regressions or errors with stack traces.
6. **Blockers & Missing Prerequisites:** Missing credentials, uninstalled toolchains, or hardware dependencies.
7. **Files / Documentation Changed:** Modified and created paths in the current turn.
8. **Git Commit & Remote State:** Current branch, commit hash, and remote synchronization status.
9. **Backup & Memory State:** Status of `memory.md` and recovery points.
10. **Exact Next Task:** The immediate next actionable task ID and plan.

---

## 6. Git & GitHub Protocols

- Maintain clean, semantic commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Always ensure `.gitignore` excludes secrets, `.env`, virtualenvs, build artifacts, databases, and heavy model weights.
- Never force-push or rewrite shared history without authorization.
- If remote connectivity or authentication is unavailable, commit locally and record the pending remote push in `/status`.
- Treat Git as the authoritative source of history; maintain local backups for runtime SQLite databases and persistent user memory.
