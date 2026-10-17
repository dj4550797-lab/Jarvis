# JARVIS — Phase 5: Controlled Computer Operations Specification

**Version:** 1.0  
**Phase:** 5 (COMPLETED)  
**Parent Document:** [PLAN.md](file:///f:/Jarvis/docs/PLAN.md)  
**Requirements:** [JARVIS_Master_PRD.md](file:///f:/Jarvis/docs/JARVIS_Master_PRD.md) Section 14 (Phase 5)  
**Security Standards:** [SECURITY.md](file:///f:/Jarvis/docs/SECURITY.md) Section 9 & 11  

---

## 1. Objective

Allow JARVIS to execute approved operations on the host computer under a strict least-privilege, default-deny security model. Enforces sandbox boundaries, path traversal rejection, approval flows for destructive operations, centralized action audit logging, and an instant emergency stop mechanism.

---

## 2. Core Architecture

```
                    User / Chat / Frontend UI
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
     Emergency Stop Check              Action Confirmation Guard
    (Global Halt Interrupter)         (Explicit User Approval Flow)
              |                                 |
              +----------------+----------------+
                               |
                               v
                     Tool Execution Engine
                  [Tool Registry & Capability]
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
      Sandbox & Security              Action Audit Logger
   (Path Traversal Guard,             (Persistent SQLite
    Approved Roots, Whitelists)         Audit Log Trail)
              |
     +--------+--------+--------+--------+
     |                 |                 |
     v                 v                 v
File Tools        App Launcher      System Tools
(search/read/    (Whitelisted       (metrics/specs/
 write safe)      binaries)          status)
```

---

## 3. Tool Registry & Capabilities

### 3.1 Capability Definitions
- `filesystem.read`: Read files and search directory structures within approved scopes.
- `filesystem.write`: Create or modify files within approved scopes.
- `process.launch`: Execute vetted, allowlisted applications without arbitrary shell access.
- `process.inspect`: Query active application states.
- `system.control`: Inspect system metrics, toggle emergency stop, and modify tool policies.

### 3.2 Implemented Tools
1. **`file_search`**: Safe directory traversal within approved workspace with depth, pattern, and file count limits.
2. **`file_read`**: Reads text files within approved boundaries with size caps (10MB limit) and MIME/encoding checks.
3. **`file_write`**: Writes files within approved boundaries. Requires explicit confirmation if overwriting existing files. Uses atomic writes via temporary files.
4. **`app_launch`**: Launches curated applications from an allowlist (`notepad`, `calc`, `explorer`, `cmd-restricted-task`). Blocks arbitrary shell injections (`powershell -enc`, `cmd /c`, etc.).
5. **`system_status`**: Gathers host CPU, memory, and disk usage safely.

---

## 4. Security Controls & Guardrails

1. **Path Traversal Defense:**
   - Canonicalizes every target path using `os.path.realpath` / `Path.resolve()`.
   - Rejects any path resolving outside authorized root directories (`f:\Jarvis` or user-defined project directory).
   - Explicitly rejects `..`, drive letters changing root context, Windows device paths (`\\.\`, `\\?\`), and UNC shares.
2. **Confirmation Safeguards:**
   - Destructive actions (such as overwriting an existing file) require `confirmation_token` or explicit `confirmed=True` parameter.
3. **Emergency Stop:**
   - A single global state (`emergency_stop_engaged: bool`).
   - When active, all tool executions immediately abort and return `409 Conflict`.
   - Can only be reset via explicit user authorization.
4. **Action Audit Trail:**
   - All tool invocations, parameters, timestamps, execution outcomes, and latency are written to the database `audit_logs` table.

---

## 5. Acceptance Checklist

- [x] Tool registry defines explicit input schemas, capability requirements, and confirmation flags.
- [x] Path traversal attempts (`..`, escape to `C:\Windows`, etc.) are unconditionally blocked and logged.
- [x] File write employs atomic operations and blocks silent file overwrite without explicit confirmation.
- [x] Application launcher only starts approved binaries from an explicit whitelist; rejects arbitrary shell commands.
- [x] Emergency stop halts tool executions instantly and rejects queued operations.
- [x] Audit logs persist every tool invocation and result to the SQLite database.
- [x] REST API endpoints for tool enumeration, execution, audit history, and emergency stop implemented.
- [x] Frontend UI provides tools management, emergency stop control, interactive tool execution, and live audit logs.
- [x] Automated tests verify security, path traversal prevention, emergency stop, and tool outputs.
