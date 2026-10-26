# TEST.md — Testing Strategy, Automated Test Suites & Verification Log

This document defines the comprehensive QA test architecture, automated suites, offline acceptance protocols, and verified execution records for **JARVIS**.

---

## 1. Testing Philosophy & Zero-Fabrication Rule

1. **Empirical Evidence Only:** A test is considered passing **only** when executed against the real runtime and verified in actual execution logs. Never fabricate test outputs.
2. **Mocks Boundary:** Mocks are strictly limited to external network calls during isolated unit tests. Production code must never serve mock data.
3. **Offline Enforced Testing:** All core functionalities (inference, memory, files, commands) must pass offline tests with the network interface disabled.

---

## 2. Test Execution Commands

### 2.1 Backend Tests (Python / Pytest)
```powershell
# Run entire backend test suite
.\.venv\Scripts\pytest.exe tests -v

# Run fast unit tests only
.\.venv\Scripts\pytest.exe tests/unit -v

# Run integration tests (database, migration, services)
.\.venv\Scripts\pytest.exe tests/integration -v
```

### 2.2 Desktop Frontend Tests (React / Vitest / TypeScript)
```powershell
cd apps/desktop

# Type check
npm run typecheck

# Production bundle build test
npm run build
```

---

## 3. Verified Execution Log

| Date / Timestamp | Suite / Command | Total | Passed | Failed | Skipped | Evidence / Notes |
|---|---|---|---|---|---|---|
| 2026-10-26 20:15 | Environment Audit | 4 | 4 | 0 | 0 | Node 24.18, npm 11.16, Python 3.12.10, Git verified. |
| 2026-10-26 20:33 | Backend Pytest (`tests -v`) | 8 | 8 | 0 | 0 | Verified: `test_api.py`, `test_db.py`, `test_config.py`, `test_schemas.py`. Passed in 63.97s. |
| 2026-10-26 20:41 | Frontend Build (`tsc && vite build`) | 1 | 1 | 0 | 0 | 1577 modules transformed. Zero TypeScript errors. Output in `dist/`. |
| 2026-10-26 21:28 | Frontend Build (`tsc && vite build`) | 1 | 1 | 0 | 0 | 1609 modules transformed (all 32 pages). Zero TypeScript errors. Passed in 10.35s. |
| 2026-10-26 21:30 | Backend Pytest (`tests -v`) | 9 | 9 | 0 | 0 | Added `test_providers_and_backups_api`. All passed in 11.47s. |

### Detailed Pytest Log Summary (Phase 2 - 2026-10-26):
```text
tests/integration/test_api.py::test_health_and_status_endpoints PASSED   [ 11%]
tests/integration/test_api.py::test_task_execution_lifecycle PASSED      [ 22%]
tests/integration/test_api.py::test_providers_and_backups_api PASSED     [ 33%]
tests/integration/test_db.py::test_database_initialization PASSED        [ 44%]
tests/integration/test_db.py::test_memory_fts5_indexing PASSED           [ 55%]
tests/unit/test_config.py::test_settings_defaults PASSED                 [ 66%]
tests/unit/test_config.py::test_ensure_directories PASSED                [ 77%]
tests/unit/test_schemas.py::test_command_request_validation PASSED       [ 88%]
tests/unit/test_schemas.py::test_memory_create_validation PASSED         [100%]
============================= 9 passed in 11.47s ==============================
```

---

## 4. Offline Acceptance Protocol (12-Step Verification)

1. [ ] Install/start JARVIS with configured local model.
2. [ ] Verify model loads into memory and reports loaded status.
3. [ ] Disconnect physical/virtual internet adapter.
4. [ ] Restart the application.
5. [ ] Verify local conversational inference executes without error.
6. [ ] Verify local memory retrieval functions correctly.
7. [ ] Ingest a local file and perform full-text and semantic search.
8. [ ] Verify that cloud fallback is strictly blocked and reported.
9. [ ] Verify that online-dependent features display clear "Unavailable Offline" badges.
10. [ ] Reconnect network and verify seamless re-synchronization.
11. [ ] Audit outbound network logs to confirm zero requests during offline period.
12. [ ] Record hardware specifications, model identifier, and execution latency.
