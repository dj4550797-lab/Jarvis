-- JARVIS Canonical SQLite Schema (v1.0.0 Baseline)

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- 1. Schema Migration History
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    command_raw TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Draft', 'Queued', 'Running', 'AwaitingApproval', 'Paused', 'Completed', 'PartiallyCompleted', 'Failed', 'Cancelled', 'Blocked')),
    risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    requires_approval BOOLEAN DEFAULT 0,
    approved_at DATETIME NULL,
    progress_pct REAL DEFAULT 0.0,
    device_id TEXT NOT NULL DEFAULT 'windows-desktop',
    result_summary TEXT NULL,
    error_details TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- 3. Task Steps
CREATE TABLE IF NOT EXISTS task_steps (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    parameters TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Running', 'Success', 'Failed', 'Skipped')),
    output_data TEXT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);

-- 4. Contextual & Semantic Memories
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    memory_type TEXT NOT NULL CHECK(memory_type IN ('fact', 'preference', 'episodic', 'project_context')),
    category TEXT NOT NULL CHECK(category IN ('user', 'system', 'coding', 'personal', 'device')),
    content TEXT NOT NULL,
    source_ref TEXT NULL,
    importance REAL DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    is_sensitive BOOLEAN DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);

-- 5. Knowledge Vault Documents
CREATE TABLE IF NOT EXISTS vault_documents (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size_bytes INTEGER NOT NULL,
    file_hash_sha256 TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    indexed_status TEXT NOT NULL CHECK(indexed_status IN ('pending', 'indexing', 'indexed', 'failed')),
    chunk_count INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Document Chunks & Vector Embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    embedding_blob BLOB NULL,
    FOREIGN KEY (document_id) REFERENCES vault_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- 7. Providers & Model Configurations
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK(provider_type IN ('local_engine', 'cloud_api', 'ollama')),
    is_enabled BOOLEAN DEFAULT 1,
    is_local BOOLEAN NOT NULL DEFAULT 1,
    endpoint_url TEXT NULL,
    encrypted_api_key TEXT NULL,
    last_health_status TEXT DEFAULT 'unknown',
    last_checked_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS model_configs (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_family TEXT NOT NULL,
    context_window INTEGER DEFAULT 4096,
    is_active BOOLEAN DEFAULT 0,
    is_downloaded BOOLEAN DEFAULT 0,
    file_size_bytes INTEGER DEFAULT 0,
    file_path TEXT NULL,
    sha256_hash TEXT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'user',
    action_details TEXT NOT NULL DEFAULT '{}',
    risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    ip_or_origin TEXT NOT NULL DEFAULT '127.0.0.1',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- 9. Full-Text Search (FTS5) Tables
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    content,
    category,
    content='memories',
    content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
    chunk_text,
    content='document_chunks',
    content_rowid='rowid'
);
