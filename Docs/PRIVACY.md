# PRIVACY.md — Privacy Policy & Data Sovereignty Guarantees

This document articulates the strict privacy boundaries, data sovereignty guarantees, data retention rules, and user deletion rights implemented across **JARVIS**.

---

## 1. Core Principle: Absolute User Sovereignty

JARVIS is built on the tenet that your personal thoughts, files, voice recordings, screen content, and habits belong exclusively to you.
- **Local-First Default:** All data processed by JARVIS resides on your local hardware by default.
- **No Telemetry Surveillance:** JARVIS does not bundle hidden analytics, tracker pixels, telemetry beacons, or advertising SDKs.
- **No Cloud Vendor Lock-in:** You can export your entire memory, task history, and knowledge base at any time in open JSON/SQLite formats.

---

## 2. Local vs. Cloud Processing Boundaries

### 2.1 Local / Offline Mode (Enforced Privacy)
When Local Mode is active (`JARVIS_OFFLINE_MODE=true`):
- All natural language processing, embeddings, file reading, and task planning are conducted entirely by local on-device models (e.g. GGUF models via llama.cpp).
- Speech-to-text and text-to-speech are processed via local offline speech models.
- **Zero data** leaves your computer or phone over the network.
- Outbound socket connections to cloud model providers are strictly blocked.

### 2.2 Online / Hybrid Mode (Explicit Consent)
When Online/Hybrid mode is explicitly enabled by the user:
- External queries are routed only to the specific providers configured with your own personal API keys.
- Prompts sent to external providers contain only the minimum context required for the immediate query.
- Sensitive memories tagged as private are filtered out before dispatching remote requests.

---

## 3. Data Ingestion & Storage Inventory

| Data Type | Storage Location | Retention Policy | User Controls |
|---|---|---|---|
| **Chat Conversations** | Local SQLite (`jarvis.db`) | User-configured (Default: Indefinite) | Full Export / Delete by Session |
| **Contextual Memories** | Local SQLite (`jarvis.db`) | User-configured | Search / Edit / Delete individual facts |
| **Knowledge Vault Documents** | Local SQLite & File Storage | Synchronized with source file existence | Remove from index / Unlink |
| **Voice Recordings** | Temporary memory buffer | Discarded immediately after transcription | Never persisted to disk |
| **Screen Captures** | Temporary memory buffer | Discarded immediately after OCR processing | Never persisted unless user flags task |
| **Audit Logs** | Local SQLite (`jarvis.db`) | 90 days rolling window | Export / Clear logs |

---

## 4. User Deletion & Cryptographic Shredding Rights

You retain absolute authority to delete any or all data stored by JARVIS:
1. **Single Record Deletion:** You can delete individual memories, task records, or documents from the dashboard at any time.
2. **Category Purging:** You can purge specific categories (e.g., all browsing tasks, all episodic memories) with one click.
3. **Complete System Wipe:** Invoking "Shred All Data" permanently destroys the SQLite database, clears all cached vectors, and overwrites sensitive keys with random bytes.

---

## 5. Diagnostic Log Redaction

Application logs generated for troubleshooting purposes automatically redact:
- API keys, tokens, and secret passwords.
- Credit card numbers, emails, and phone numbers via regex redaction filters.
- Absolute usernames and system paths where possible.
