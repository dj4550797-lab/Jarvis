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
pytest backend/tests -v

# Run fast unit tests only
pytest backend/tests/unit -v

# Run integration tests (database, migration, services)
pytest backend/tests/integration -v

# Run security & boundary tests
pytest backend/tests/security -v

# Run with test coverage report
pytest backend/tests --cov=jarvis --cov-report=term-missing
```

### 2.2 Desktop Frontend Tests (React / Vitest / TypeScript)
```powershell
cd apps/desktop

# Run unit and component tests
npm run test

# Run strict TypeScript type checks
npm run typecheck

# Run linter
npm run lint
```

### 2.3 Android Mobile Tests (Gradle / JUnit / Espresso)
```powershell
cd apps/android

# Run local unit tests
./gradlew testDebugUnitTest

# Run connected Android instrumentation tests (requires emulator/device)
./gradlew connectedDebugAndroidTest
```

---

## 3. Test Suite Inventory

### 3.1 Unit Test Suites (`backend/tests/unit`)
- `test_config.py`: Validates environment loading, default paths, and secret salt handling.
- `test_schemas.py`: Validates Pydantic v2 schemas for tasks, memories, and API contracts.
- `test_task_state_machine.py`: Enforces valid state transitions (Draft -> Queued -> Running -> Completed/Failed).
- `test_encryption.py`: Verifies AES-256-GCM encryption, decryption, and tampering detection.
- `test_provider_routing.py`: Tests model router policy (offline enforcement, cloud exclusion).

### 3.2 Integration Test Suites (`backend/tests/integration`)
- `test_db_migrations.py`: Verifies SQLite schema creation, WAL mode configuration, and migration rollbacks.
- `test_memory_service.py`: Tests semantic memory persistence, retrieval, and FTS5 full-text search.
- `test_vault_indexing.py`: Ingests test documents, verifies SHA-256 hashing, chunking, and search querying.
- `test_api_endpoints.py`: Tests FastAPI REST routes (`/api/v1/health`, `/api/v1/tasks`, `/api/v1/memories`).

### 3.3 Security Test Suites (`backend/tests/security`)
- `test_path_traversal.py`: Validates file reading/writing protections against path traversal (`../../`).
- `test_approval_elevation.py`: Ensures elevated actions (file deletion, shell command) halt without interactive user approval.
- `test_zero_api_leakage.py`: Intercepts socket calls to verify zero network requests occur when `JARVIS_OFFLINE_MODE=true`.

---

## 4. Offline Acceptance Protocol (12-Step Verification)

As mandated by the PRD Addendum, before any release candidate is certified, it must complete the following 12-step verification:

1. [ ] Install/start JARVIS with configured local model.
2. [ ] Verify model loads into memory and reports loaded status.
3. [ ] Disconnect physical/virtual internet adapter.
4. [ ] Restart the application.
5. [ ] Verify local conversational inference executes without error.
6. [ ] Verify local memory retrieval functions correctly.
7. [ ] Ingest a local file and perform full-text and semantic search.
8. [ ] Verify that cloud fallback is strictly blocked and reported.
9. [ ] Verify that online-dependent features (web search, cloud APIs) display clear "Unavailable Offline" badges.
10. [ ] Reconnect network and verify seamless re-synchronization without task corruption.
11. [ ] Audit outbound network logs to confirm zero requests during offline period.
12. [ ] Record hardware specifications, model identifier, and execution latency.

---

## 5. Verification Records & Execution History

| Date / Timestamp | Suite / Command | Total | Passed | Failed | Skipped | Evidence / Notes |
|---|---|---|---|---|---|---|
| 2026-10-26 (Phase 0) | Environment Audit | 4 | 4 | 0 | 0 | Node 24.18, npm 11.16, Python 3.12.10, Git verified. Cargo pending for Tauri. |
| Pending Phase 1 | Backend Unit & Integration | - | - | - | - | Scheduled for Phase 1 foundation completion. |

---

## 6. Known Failures & Blockers

1. **Cargo Toolchain:** `cargo` command is not currently in system PATH. Tauri desktop native bundling will remain in dev web mode until Rust toolchain is installed. Automated headless tests will run via Vitest and Pytest.
