# JARVIS — Phase 3: Persistent Memory Specification

**Version:** 1.0  
**Phase:** 3 (COMPLETED)  
**Parent Document:** [PLAN.md](file:///f:/Jarvis/docs/PLAN.md)  
**Requirements:** [JARVIS_Master_PRD.md](file:///f:/Jarvis/docs/JARVIS_Master_PRD.md) Section 11  
**Security Standards:** [SECURITY.md](file:///f:/Jarvis/docs/SECURITY.md) Section 11  

---

## 1. Objective

Enable JARVIS to retain, recall, search, edit, and safely manage context across user sessions while adhering strictly to local-first privacy, honesty regarding uncertain inferences, and absolute prohibition against storing unencrypted credentials in ordinary memories.

---

## 2. Memory Taxonomy & Schema

### 2.1 Memory Types
Per PRD Section 11.1, memories are partitioned into distinct semantic types:
1. `explicit_fact`: Directly stated user facts (e.g., "User's primary operating system is Windows 10").
2. `preference`: User preferences and styling guidelines (e.g., "Prefers concise answers and type annotations").
3. `project_context`: Active project details, tech stacks, or architectures (e.g., "JARVIS is built with FastAPI and React").
4. `reminder`: User-approved persistent tasks or reminders.
5. `inferred`: Inferred habits or preferences, marked explicitly with `is_uncertain=True` and a numerical `confidence` score (0.0 to 1.0).

> [!IMPORTANT]
> **Honesty Rule (PRD 11.1):** Inferred memories are never presented or treated as confirmed facts. They are disclosed to the AI model with an explicit uncertainty disclaimer and confidence score.

### 2.2 Database Schema (`memories` table)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | PRIMARY KEY | UUID v4 identifier |
| `content` | `TEXT` | NOT NULL | The text content of the memory |
| `memory_type` | `VARCHAR(50)` | NOT NULL, INDEX | `explicit_fact`, `preference`, `project_context`, `reminder`, `inferred` |
| `category` | `VARCHAR(50)` | NULLABLE, INDEX | Grouping tag (e.g. `coding`, `personal`, `workflow`) |
| `is_uncertain` | `BOOLEAN` | NOT NULL, DEFAULT False | Flag indicating whether this is an unverified inference |
| `confidence` | `FLOAT` | NOT NULL, DEFAULT 1.0 | Confidence rating (1.0 for facts, <1.0 for inferences) |
| `source` | `VARCHAR(100)` | NOT NULL, DEFAULT 'user' | Source origin (`user`, `conversation`, `system`) |
| `tags_json` | `TEXT` | NOT NULL, DEFAULT '[]' | JSON-serialized array of keyword tags |
| `created_at` | `DATETIME` | NOT NULL, UTC, INDEX | Creation timestamp |
| `updated_at` | `DATETIME` | NOT NULL, UTC | Last modification timestamp |

---

## 3. Privacy & Security Constraints

Per [SECURITY.md](file:///f:/Jarvis/docs/SECURITY.md) Section 11.1:
1. **Credential Rejection:** Any memory content containing patterns matching API keys (OpenAI, AWS, GitHub, etc.), private keys (`BEGIN PRIVATE KEY`), passwords, or Bearer tokens is rejected with an explicit validation error (`422 Unprocessable Entity` / `CredentialExposureError`).
2. **Local Loopback Only:** All memory retrieval and mutation APIs are accessible only through `127.0.0.1`.
3. **Audit Logging:** Every memory creation, modification, deletion, and bulk clear action generates an entry in `audit_logs`.
4. **Explicit Clear Confirmation:** Bulk deletion (`POST /api/v1/memories/clear`) requires explicit payload `{"confirm": true}` and records a security audit log.

---

## 4. API Specification

- `GET /api/v1/memories`: List and search memories (supports query string, memory_type, category, is_uncertain, limit, offset).
- `POST /api/v1/memories`: Create a memory item (validates against credential leakage).
- `GET /api/v1/memories/{memory_id}`: Get single memory by ID.
- `PUT /api/v1/memories/{memory_id}`: Update memory content, type, tags, or confidence.
- `DELETE /api/v1/memories/{memory_id}`: Delete an individual memory.
- `POST /api/v1/memories/clear`: Clear all memories after explicit confirmation (`{"confirm": true}`).
- `GET /api/v1/memories/export`: Export memory collection as JSON.

---

## 5. AI Conversation Context Injection

When generating responses in the AI Router:
1. Relevant memories are fetched from SQLite (respecting `auto_memory_enabled` and `max_active_memories`).
2. Formatted into a scoped context block:
   ```
   [Persistent Memory Context]
   Confirmed User Facts & Preferences:
   • [Explicit Fact]: Primary language: Python & TypeScript
   • [Preference]: Prefers concise, modular code

   Uncertain Inferences (Honesty Rule: Do not present these as confirmed facts without user confirmation):
   • [Inferred Context - 65% confidence]: May prefer dark mode themes
   ```
3. Injected into conversation history as system context so assistant responses naturally adapt to the user's persistent preferences across sessions.

---

## 6. Acceptance Checklist

- [x] Memory SQLAlchemy ORM model and Alembic migration (`2b73d810f924`) created and applied.
- [x] Memory security validation prevents storing API keys, passwords, and private keys (HTTP 422).
- [x] Memory CRUD, search, and pagination endpoints implemented.
- [x] Bulk clear with explicit confirmation flow implemented.
- [x] Memory export (JSON format) implemented.
- [x] AI prompt context injection implemented with distinction between facts and uncertain inferences.
- [x] Frontend `MemoryView` implemented with search, filtering, creation modal, edit/delete, and clear flow.
- [x] Navbar and App updated with `Memory` tab.
- [x] Automated tests passing for models, security validation, and API endpoints (36 backend, 8 frontend).

---

## 7. Verification Evidence

### 7.1 Backend Pytest (36/36 Passed)
```
backend/tests/test_ai_router.py (4 tests) PASSED
backend/tests/test_chat.py (1 test) PASSED
backend/tests/test_chat_stream.py (3 tests) PASSED
backend/tests/test_config.py (5 tests) PASSED
backend/tests/test_database.py (2 tests) PASSED
backend/tests/test_health.py (2 tests) PASSED
backend/tests/test_memory_api.py (6 tests) PASSED
backend/tests/test_memory_security.py (8 tests) PASSED
backend/tests/test_memory_service.py (5 tests) PASSED
================== 36 passed, 4 warnings in 74.57s ==================
```

### 7.2 Frontend Vitest (8/8 Passed)
```
 ✓ src/features/chat/ChatView.test.tsx (3 tests)
 ✓ src/App.test.tsx (2 tests)
 ✓ src/features/memory/MemoryView.test.tsx (3 tests)
 Test Files  3 passed (3)
      Tests  8 passed (8)
```

### 7.3 Frontend Production Build
```
vite v5.4.21 building for production...
✓ 1598 modules transformed.
dist/index.html                   1.19 kB │ gzip:  0.64 kB
dist/assets/index-DNRgu07A.css    9.88 kB │ gzip:  2.78 kB
dist/assets/index-BRPclTYN.js   198.87 kB │ gzip: 58.76 kB
✓ built in 14.91s
```

### 7.4 End-to-End Live Check (`verify_phase_3.py`)
```
--- Starting Phase 3 Persistent Memory Verification ---
[OK] Credential protection: API key in memory content was blocked with HTTP 422
[OK] Explicit preference created: 2a4e6bcd-ec21-4ad7-98dd-4c165a6bdff4 ('User prefers TypeScript and strict mode enabled.')
[OK] Inferred memory created: 317af946-9b4a-47ba-8b15-ba532629d615 (confidence=0.65)
[OK] Memory search verified: found 1 matching records for 'TypeScript'
[OK] Chat interaction with active memory context executed successfully (model: mock:mock-echo-v1)
[OK] Memory update verified: content refreshed cleanly
[OK] Memory export verified: 2 records exported in structured format
[OK] Single memory deletion verified: 204 returned and 404 confirmed
[OK] Clear all memory with explicit confirmation verified (1 records cleared)
--- ALL PHASE 3 VERIFICATIONS PASSED ---
```
