# Phase 7 — Coding and Research Assistance Specification

## 1. Overview & Objectives

Phase 7 implements controlled software development assistance and evidence-based research capabilities for the JARVIS desktop assistant. It adheres strictly to PRD Section 17 & 18, PLAN.md Section 11, and SECURITY.md.

### Key Objectives

1. **Approved Project Inspection & File Navigation**:
   - Inspect approved local project directories within authorized sandbox boundaries (`SandboxGuard`).
   - Recursively index project files, language types, lines of code, and git statuses.
   - Prevent any directory traversal (`..`) or unauthorized disk access outside permitted roots.

2. **Code Diagnostics & Symbol Search**:
   - Search source code for identifiers, classes, functions, and error patterns with regex and line matching.
   - Python AST analysis (`ast.parse`) providing line-accurate syntax validation and precise diagnostic reporting.
   - Structured stack trace parsing for Python and JavaScript/TypeScript exception traces, linking traces to local files where available.

3. **Unified Diff & Rollback-Protected Modifications**:
   - Generate standard unified diffs (`difflib.unified_diff`) showing proposed line additions and deletions before modification.
   - Atomic patch application: creates a pre-modification snapshot in SQLite before touching files on disk.
   - Reversible modifications: one-click snapshot rollback restoring the exact previous file state.

4. **Controlled Test Execution**:
   - Execute approved tests (e.g. `pytest`, `npm test`) with strict timeout limits and non-shell process spawning (`shell=False`).
   - Truthful execution reporting: never report a test as passed without actual execution and return code verification.

5. **Evidence-Based Research Assistant**:
   - Organize research sessions, questions, hypotheses, and structured findings.
   - Genuine citation and source tracking (URL, title, snippet, verified status, access timestamp).
   - Strict Honesty Rule: explicitly distinguish verified facts from uncertain claims (`is_verified=True/False`).
   - Export research reports to clean, standard Markdown and JSON formats.

---

## 2. Architecture & Data Model

### 2.1 Database Models (`backend/app/models/coding_research.py`)

#### `CodeSnapshot` (`code_snapshots` table)
- `id`: String (UUIDv4 primary key)
- `file_path`: String(512), indexed
- `original_content`: Text (full file contents prior to patch)
- `diff_patch`: Text (unified diff applied)
- `reason`: String(255)
- `restored`: Boolean, default False
- `created_at`: DateTime(timezone=True)
- `restored_at`: DateTime(timezone=True), nullable

#### `ResearchSession` (`research_sessions` table)
- `id`: String (UUIDv4 primary key)
- `title`: String(255)
- `topic`: String(255)
- `status`: String(32) (`active`, `completed`, `archived`)
- `summary`: Text, nullable
- `created_at`: DateTime(timezone=True)
- `updated_at`: DateTime(timezone=True)

#### `ResearchSource` (`research_sources` table)
- `id`: String (UUIDv4 primary key)
- `session_id`: String(36), foreign key -> `research_sessions.id`, indexed
- `url`: String(1024), nullable
- `title`: String(255)
- `snippet`: Text
- `is_verified`: Boolean, default False
- `confidence`: Float, default 1.0
- `notes`: Text, nullable
- `created_at`: DateTime(timezone=True)

---

## 3. Backend Engine Components

### 3.1 `backend/app/coding/`
- `inspector.py`: Directory scanner, file reader (capped bounds), Python AST syntax validator, code symbol searcher.
- `diagnostics.py`: Regex & traceback parser parsing exception name, message, stack frames (file, line, function, code).
- `patcher.py`: Unified diff generator, file patch applier with automatic snapshot creation, and one-click rollback engine.
- `test_runner.py`: Subprocess test runner with timeout enforcement, capturing stdout/stderr and exit codes.

### 3.2 `backend/app/research/`
- `service.py`: Research session management, source collection, factual validation, and Markdown report generation.

---

## 4. API Surface

### Coding API (`/api/v1/coding`)
- `POST /api/v1/coding/inspect`: Inspect project directory files and structure.
- `POST /api/v1/coding/search`: Search symbols/text within project files.
- `POST /api/v1/coding/diagnose`: Parse stack trace or validate Python syntax.
- `POST /api/v1/coding/diff`: Generate unified diff between original file and proposed changes.
- `POST /api/v1/coding/apply-patch`: Apply patch atomically with snapshot creation.
- `POST /api/v1/coding/rollback`: Restore a previous file snapshot.
- `GET /api/v1/coding/snapshots`: List modification snapshot history.
- `POST /api/v1/coding/run-tests`: Run approved project test command.

### Research API (`/api/v1/research`)
- `GET /api/v1/research/sessions`: List research sessions.
- `POST /api/v1/research/sessions`: Create new session.
- `GET /api/v1/research/sessions/{id}`: Get session details and sources.
- `POST /api/v1/research/sessions/{id}/sources`: Add verified or uncertain source note.
- `DELETE /api/v1/research/sources/{id}`: Delete a research source.
- `POST /api/v1/research/sessions/{id}/export`: Export session findings to Markdown.

---

## 5. Verification & Acceptance Criteria
1. Project modifications remain strictly within authorized directories (`SandboxGuard`).
2. Proposed changes show verifiable unified diffs before being applied.
3. Every file modification generates a recoverable snapshot; rollback restores the exact original file content.
4. Python AST syntax checking accurately flags syntax errors and line/column numbers.
5. Test runner executes tests via real subprocesses, accurately reporting pass/fail outcomes.
6. Research notes explicitly distinguish verified facts from uncertain claims.
7. Complete test coverage across backend (pytest) and frontend (vitest), maintaining 0 regressions.
