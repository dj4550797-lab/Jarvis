# ADR 0003: Local Persistence, Vector Search and Atomic Backup Strategy

- **Status:** Accepted
- **Deciders:** Principal Software Architect, Project Owner
- **Date:** 2026-10-26

---

## Context and Problem Statement

JARVIS must operate in a zero-dependency, local-first offline environment while persisting user conversations, contextual memory facts, indexed documents, and audit logs. It must support high-speed keyword search, semantic search, and non-blocking hot backups.

---

## Decision Drivers

- Zero installation friction (no background PostgreSQL or Redis services required).
- Crash safety and atomic ACID transactions.
- Fast full-text and semantic vector retrieval.
- Seamless point-in-time recovery and snapshot capabilities.

---

## Considered Options

1. **Option 1:** SQLite 3.38+ with Write-Ahead Logging (WAL), FTS5 full-text search, and serialized vector similarity search.
2. **Option 2:** Client-server PostgreSQL + pgvector.
3. **Option 3:** Pure NoSQL JSON files on disk.

---

## Decision Outcome

**Chosen Option: Option 1 — SQLite 3.38+ (WAL mode) + FTS5 + Local Vector Engine.**

### Positive Consequences
- **Zero Configuration:** Entire database is contained within a single file (`jarvis.db`) with zero external service dependencies.
- **WAL Concurrency:** Readers never block writers and writers never block readers.
- **Sub-Millisecond Search:** SQLite FTS5 provides instant full-text indexing over tens of thousands of document chunks.
- **Atomic Online Backups:** Uses SQLite's online backup API to take consistent hot snapshots without pausing running tasks.
- **Cross-Platform:** The exact same SQLite database file can be inspected or synchronized between Windows and Android (via Room).

### Negative Consequences / Mitigations
- Vector similarity at scale (100k+ embeddings) requires approximate nearest neighbor (ANN) indexing.
- *Mitigation:* For personal desktop vaults (< 50,000 document chunks), brute-force float32 dot-product vectorized with NumPy completes in < 5ms. If the index exceeds 50,000 chunks, an embeddable local index (such as sqlite-vss or FAISS-cpu) can be enabled.
