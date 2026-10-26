# SECURITY.md — Security Architecture, Threat Model & Policies

This document establishes the security architecture, risk classification, isolation boundaries, credential protection mechanisms, and vulnerability reporting procedures for **JARVIS**.

---

## 1. Security Philosophy & Guiding Principles

1. **Local-First Trust Boundary:** All user memories, conversation histories, indexed files, and credentials are treated as private sovereign data stored strictly on the local machine.
2. **Zero-API Leakage Guarantee:** In Local/Offline Mode (`JARVIS_OFFLINE_MODE=true`), all outbound socket traffic to external AI providers or remote endpoints is blocked at the routing layer.
3. **Explicit User Elevation:** High-risk operations (file deletion, OS command execution, sensitive credential access, external purchases) require interactive user approval.
4. **Least Privilege:** Native OS operations are executed within the minimal necessary privileges.

---

## 2. Threat Model & Mitigation Strategies

| Threat Vector | Description | Architectural Mitigation |
|---|---|---|
| **Prompt Injection** | Malicious input injected via web pages, emails, or documents attempting to force unauthorized actions. | Strict separation of reasoning context from execution parameters. Every tool action evaluates a structured risk level; elevated tools require explicit user confirmation regardless of model assertion. |
| **Path Traversal** | Malicious command parameters attempting to read or overwrite arbitrary system files (`../../Windows`). | Strict path canonicalization (`os.path.realpath`) and validation against whitelist directories (`JARVIS_DATA_DIR`, `JARVIS_VAULT_DIR`). |
| **Command Injection** | Unsanitized user or model text passed into shell subprocesses. | Subprocesses avoid `shell=True`. Arguments are passed as structured arrays with strict parameter validation schemas. |
| **Credential Exfiltration** | Rogue plugins or prompt leaks attempting to expose API keys. | API keys are stored encrypted at rest via AES-256-GCM and never included in prompt contexts or unredacted log files. |
| **Unauthorized Fallback** | Local model failure triggering invisible transmission of sensitive data to cloud models. | Hard failure mode: when offline mode is selected, cloud fallback is strictly forbidden and produces a descriptive local error. |

---

## 3. Action Risk Classification & Elevation Gates

All autonomous actions are classified into four risk tiers:

```
[ Tier 1: LOW ] ──> Auto-executed (Read local status, format text, search indexed files)
[ Tier 2: MEDIUM ] ──> Auto-executed with notification (Write non-executable file, launch known app)
[ Tier 3: HIGH ] ──> Interactive Confirmation Required (Delete files, execute shell commands, modify config)
[ Tier 4: CRITICAL ] ──> Explicit Confirmation + Cryptographic Auth (Shred database, export private keys)
```

---

## 4. Credential & Secrets Management

- **Storage Engine:** SQLite encrypted columns using AES-256-GCM.
- **Key Derivation:** PBKDF2 with SHA-256 using machine-specific hardware identifiers combined with `JARVIS_SECRET_SALT`.
- **Memory Protection:** Decrypted tokens exist in memory only during the active HTTP request and are cleared after completion.
- **Git Protection:** `.gitignore` excludes `.env`, `*.pem`, `*.key`, `*.keystore`, and SQLite database files.

---

## 5. Audit Logging Policy

Every command execution, risk assessment, user approval/denial, and tool execution is recorded in the immutable `audit_logs` database table. Logs record:
- Timestamp (ISO8601 UTC)
- Actor (`user`, `agent`, `scheduler`)
- Event Type & Target
- Risk Level
- Parameters with sensitive data (tokens, passwords) redacted using regex masks.

---

## 6. Vulnerability Reporting

If you identify a security flaw or vulnerability within JARVIS:
- **Do not** disclose vulnerabilities publicly in issues or pull requests.
- Contact the project administrator directly at the configured security contact.
- Provide a reproducible demonstration and affected component versions.
- Security fixes will be prioritized and tagged with an immediate patch release.
