# JARVIS — Phase 2: AI Provider Routing & Conversation Specification

**Version:** 1.0  
**Phase:** 2 (COMPLETED)  
**Parent Document:** [PLAN.md](file:///f:/Jarvis/docs/PLAN.md)  
**Requirements:** [JARVIS_Master_PRD.md](file:///f:/Jarvis/docs/JARVIS_Master_PRD.md) Section 4.4, 4.5  
**Security Standards:** [SECURITY.md](file:///f:/Jarvis/docs/SECURITY.md)  

---

## 1. Objective

Enable JARVIS to communicate with AI providers via a modular, replaceable provider interface. Support local inference (Ollama detection & execution), cloud provider adapters (OpenAI-compatible, OpenRouter), Server-Sent Events (SSE) streaming responses, cancellation controls, and privacy-preserving fallback routing.

---

## 2. Architecture & Design

```
   User Message / Stream Request
                |
                v
       FastAPI Chat Router
  (/api/v1/conversations/.../stream)
                |
                v
        AI Provider Router
                |
  +-------------+-------------+-------------+
  |                           |             |
  v                           v             v
Local Ollama Adapter    Cloud Adapters   Mock Test Adapter
 (Offline / Loopback)  (OpenAI / Open-   (Always Available)
                          Router)
```

### 2.1 Core Components
1. **Base Provider Interface (`backend/app/ai/base.py`):**
   - `ChatMessage`, `GenerateOptions`, `ProviderAvailability`.
   - `generate(messages, options) -> str`
   - `stream(messages, options) -> AsyncGenerator[str, None]`
   - `check_availability() -> ProviderAvailability`
2. **Provider Implementations:**
   - **Mock Adapter (`backend/app/ai/mock.py`):** Deterministic responses, testing support, simulated streaming (`mock-echo-v1`).
   - **Ollama Adapter (`backend/app/ai/ollama.py`):** Local inference via `http://127.0.0.1:11434/api/chat` and `/api/tags`, handles missing models/server offline.
   - **OpenAI-Compatible Adapter (`backend/app/ai/openai_compat.py`):** HTTP streaming, timeout handling, credential validation for OpenAI & OpenRouter.
3. **AI Router (`backend/app/ai/router.py`):**
   - Provider registry (`mock`, `ollama`, `openai`, `openrouter`).
   - Fallback routing with privacy controls (never silently fall back to cloud from local requests without explicit user opt-in).
   - Timeouts and graceful error classification.
4. **Streaming API (`backend/app/api/v1/chat.py`):**
   - GET `/api/v1/conversations/providers` listing registered providers, availability, and models.
   - SSE endpoint `/api/v1/conversations/{id}/messages/stream` yielding tokens as `data: {"event": "token", "token": "..."}\n\n`.
   - Message persistence in SQLite upon completion of stream.
   - DELETE `/api/v1/conversations/{id}` returning HTTP 204.
5. **Frontend Streaming & Controls (`frontend/src/`):**
   - `streamMessage` helper in `api.ts` with SSE reader and `AbortSignal`.
   - Real-time token streaming with typing animation in `ChatView.tsx`.
   - Stop generation button (abort controller).
   - Session deletion in sidebar with trash button.
   - Model & provider selection dropdown in Chat Header and Settings View.

---

## 3. Acceptance Checklist

- [x] Provider interface defined with generate, stream, check_availability, list_models.
- [x] Mock provider verified with streaming and token chunking.
- [x] Ollama provider implemented with connection detection and model listing.
- [x] Cloud provider adapters implemented with secret redaction.
- [x] AI Router enforces timeout and fallback rules.
- [x] SSE streaming endpoint `/messages/stream` implemented and tested.
- [x] Frontend Chat view updated with real-time streaming, abort button, and provider indicator.
- [x] Frontend Settings view updated with active model and provider selection.
- [x] Automated tests for AI Router, Mock provider, and streaming endpoint passing (17 backend, 5 frontend).

---

## 4. Verification Evidence

### 4.1 Backend Pytest (17/17 Passed)
```
backend/tests/test_ai_router.py::test_mock_provider_generation PASSED    [  5%]
backend/tests/test_ai_router.py::test_mock_provider_streaming PASSED     [ 11%]
backend/tests/test_ai_router.py::test_ai_router_provider_listing PASSED  [ 17%]
backend/tests/test_ai_router.py::test_ai_router_fallback_to_mock_in_dev PASSED [ 23%]
backend/tests/test_chat.py::test_create_and_list_conversations PASSED    [ 29%]
backend/tests/test_chat_stream.py::test_list_providers_endpoint PASSED   [ 35%]
backend/tests/test_chat_stream.py::test_stream_message_endpoint PASSED   [ 41%]
backend/tests/test_chat_stream.py::test_delete_conversation_endpoint PASSED [ 47%]
backend/tests/test_config.py::test_valid_default_settings PASSED         [ 52%]
backend/tests/test_config.py::test_reject_invalid_environment PASSED     [ 58%]
backend/tests/test_config.py::test_reject_invalid_port PASSED            [ 64%]
backend/tests/test_config.py::test_reject_public_host_binding PASSED     [ 70%]
backend/tests/test_config.py::test_secrets_redaction PASSED              [ 76%]
backend/tests/test_database.py::test_audit_log_persistence PASSED        [ 82%]
backend/tests/test_database.py::test_conversation_cascade_delete PASSED  [ 88%]
backend/tests/test_health.py::test_health_check_endpoint PASSED          [ 94%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [100%]
======================= 17 passed, 3 warnings in 38.31s =======================
```

### 4.2 Frontend Vitest (5/5 Passed)
```
 ✓ src/features/chat/ChatView.test.tsx  (3 tests)
 ✓ src/App.test.tsx  (2 tests)
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

### 4.3 End-to-End Verification (`verify_phase_2.py`)
```
--- Starting Phase 2 Live Verification ---
[OK] Providers discovered (3):
     - mock: available=True, models=['mock-echo-v1', 'mock-diagnostic-v1']
     - ollama: available=False, models=[]
     - openai: available=False, models=[]
[OK] Created conversation: 66258b59-6413-4a07-9992-01371055e034 (Phase 2 Verification Session)
[OK] Synchronous message response received from model: mock:mock-echo-v1
[OK] SSE Stream completed with 20 events:
     Model tag: mock:mock-echo-v1
     Total tokens streamed: 18
[OK] Conversation history persisted in SQLite: 4 messages recorded
[OK] Conversation deleted cleanly (verified 404 on subsequent get)
--- ALL PHASE 2 VERIFICATIONS PASSED ---
```
