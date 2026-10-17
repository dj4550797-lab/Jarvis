JARVIS — DATABASE.md

Database Architecture, Schema, Migrations, Transactions, Backup & Restore, Validation, and Testing

Property| Specification
Project| JARVIS Desktop AI Assistant
Database| SQLite
ORM| SQLAlchemy 2.x
Migration Engine| Alembic
Desktop Architecture| Tauri 2 + React + TypeScript + Vite
Backend| Python + FastAPI + Pydantic
Database Access| Python backend only
Schema Management| Alembic version-controlled migrations
Primary Storage| Local application data directory
Initial Deployment| Single-user desktop application
Design Goal| Reliable, secure, recoverable, and testable persistence

---

1. Purpose

This document defines the database architecture and implementation requirements for JARVIS.

The database must support the capabilities defined by the existing JARVIS PRD without redefining product behavior or introducing conflicting requirements.

The implementation must provide:

- Structured persistence through SQLAlchemy 2.x.
- Schema creation and upgrades through Alembic.
- Reliable transactions and rollback.
- Data validation at application and database layers.
- Safe backup and restore.
- Migration testing and automated integrity checks.
- Controlled database access through the Python backend.
- Compatibility with the existing Tauri 2 desktop application.
- A migration path for future features without requiring a database redesign.

1.1 Requirements precedence

Use this order when resolving conflicts:

1. Existing approved JARVIS PRD.
2. Existing architecture and security specifications.
3. This database specification.
4. Implementation-specific choices.

If an existing PRD defines a different field, relationship, retention policy, permission behavior, or data lifecycle, follow the PRD and update this document accordingly.

Optional modules must not be implemented as mandatory product features merely because their tables are described here.

---

2. Architecture

2.1 Data access flow

Tauri 2 Desktop Application
          |
          v
React + TypeScript UI
          |
          v
Existing Frontend/Backend Bridge
          |
          v
FastAPI Application
          |
          v
Pydantic Validation
          |
          v
Service / Repository Layer
          |
          v
SQLAlchemy 2.x
          |
          v
SQLite Database
          |
          v
Alembic Schema Versioning

The frontend must not access the SQLite file directly.

All database operations must pass through the Python backend, which owns validation, authorization, transaction boundaries, error handling, and persistence.

The existing frontend/backend communication mechanism must remain unchanged unless the approved architecture explicitly permits a change.

2.2 Core rules

- SQLite is the initial local database.
- SQLAlchemy is the primary database access layer.
- Alembic is the only supported schema migration mechanism.
- ORM models and migrations must remain synchronized.
- Business logic must not be embedded in UI components.
- Database operations must not run on the main UI thread.
- External AI providers must never receive unrestricted database access.
- Secrets must not be stored as ordinary database values.
- Schema changes must be explicit, reviewed, tested, and version-controlled.

---

3. Dependencies

Use compatible, tested versions of the following packages:

Dependency| Purpose
"SQLAlchemy>=2.0,<3.0"| ORM and SQL expression API
"alembic>=1.13,<2.0"| Schema migrations
"pydantic>=2.0,<3.0"| Input and output validation
"pydantic-settings>=2.0,<3.0"| Typed application configuration, if required
"fastapi"| Existing backend framework
"pytest"| Automated testing
"pytest-cov"| Test coverage
"httpx"| FastAPI test client support
"aiosqlite"| Only if the approved architecture uses asynchronous SQLite access

Pin actual dependency versions in the project lockfile or dependency specification. Version ranges above are compatibility guidance, not a substitute for tested version pins.

Do not install "aiosqlite" unless asynchronous SQLAlchemy access is part of the chosen backend implementation.

---

4. Database location and lifecycle

4.1 File location

Store the database in the operating system's designated per-user application-data directory.

Example locations:

- Windows: "%LOCALAPPDATA%/<Vendor>/JARVIS/"
- macOS: "~/Library/Application Support/<Vendor>/JARVIS/"
- Linux: "$XDG_DATA_HOME/<vendor>/jarvis/", falling back to "~/.local/share/<vendor>/jarvis/"

The exact vendor and application identifiers must match the existing Tauri configuration.

Example layout:

JARVIS/
├── jarvis.db
├── backups/
│   └── <timestamped-backup>.db
├── logs/
└── other-runtime-data/

Do not put the production database inside the source repository, frontend build directory, or a temporary directory.

Never commit production database files, user conversations, API credentials, or backups to Git.

4.2 Initialization

At startup:

1. Resolve and validate the application-data directory.
2. Initialize logging without exposing sensitive content.
3. Create the SQLAlchemy engine.
4. Verify that the database can be opened.
5. Run required database integrity and schema-version checks.
6. Apply migrations using the controlled migration procedure.
7. Initialize session factories.
8. Mark the database subsystem ready only after successful validation.

Database initialization must be idempotent.

Do not call "Base.metadata.create_all()" in production as a replacement for Alembic migrations.

4.3 Startup failures

If the database is corrupt, inaccessible, or incompatible:

- Record a sanitized diagnostic event.
- Preserve the original database.
- Do not silently delete or recreate user data.
- Do not mark the database as healthy.
- Show an actionable error through the existing UI.
- Offer a recovery procedure where appropriate.

---

5. Schema design principles

5.1 Naming

- Use lowercase "snake_case" for table and column names.
- Use singular or plural table names consistently; this specification uses plural names.
- Use explicit primary and foreign key names.
- Define deterministic constraint and index names.
- Prefer explicit foreign-key relationships.
- Use UTC timestamps for persisted event times.
- Store machine-readable identifiers separately from display labels.

5.2 Primary keys

Use UUID identifiers represented as 36-character strings for entities that may eventually be synchronized or exchanged across services.

Example:

8f28a5c3-9c9d-4f2d-a7f0-1f6e7d5d9b10

Generate UUIDs in the application layer.

Integer identifiers may be used for strictly internal, high-volume append-only records if benchmarks justify the choice and the decision remains consistent.

Never change a primary-key strategy casually after data has been persisted.

5.3 Timestamps

Store timestamps as timezone-aware Python "datetime" values and normalize them to UTC before persistence.

SQLite does not provide a native timezone-aware timestamp type. Therefore:

- Use a documented SQLAlchemy type strategy.
- Normalize input values to UTC.
- Ensure values loaded from SQLite are interpreted consistently.
- Use ISO 8601 UTC timestamps at API boundaries.
- Test timestamp round trips.

Do not mix local wall-clock times and UTC timestamps in the same column.

5.4 Boolean values

Use SQLAlchemy "Boolean" columns and add database constraints when necessary to reject invalid integer values.

5.5 JSON values

Use SQLAlchemy's "JSON" type for structured, non-secret metadata when appropriate.

Validate JSON through Pydantic before persistence.

Do not store arbitrary executable code, unvalidated SQL, or unrestricted serialized Python objects.

Do not use Python "pickle" for user data or database persistence.

5.6 Data minimization

Persist only data required by the approved PRD.

Conversation history, memory, diagnostic logs, agent execution history, and other optional features must follow the product's existing retention and privacy rules.

Do not introduce permanent storage of microphone recordings, screen captures, credentials, or other sensitive data without an explicit product and security requirement.

---

6. Core schema

The following tables form the proposed persistence foundation. Existing PRD requirements determine which feature-specific tables are activated.

6.1 "app_settings"

Stores non-secret application configuration that must survive restarts.

Column| Type| Constraints
"id"| Integer| Primary key
"key"| String(120)| Unique, not null
"value_json"| JSON| Not null
"created_at"| UTC datetime| Not null
"updated_at"| UTC datetime| Not null

Rules:

- "key" must be unique.
- Validate values against the setting's defined Pydantic schema.
- Never store API keys, passwords, private keys, or authentication tokens here.
- Keep application defaults in configuration code.
- Database settings override defaults only where the PRD permits.
- Use transactions for settings updates.

6.2 "conversations"

Use this table only if the approved PRD includes persistent conversation history.

Column| Type| Constraints
"id"| UUID string| Primary key
"title"| String(200)| Nullable
"status"| String(30)| Not null, defined values
"created_at"| UTC datetime| Not null
"updated_at"| UTC datetime| Not null

Recommended status values:

- "active"
- "archived"

Do not introduce deletion or retention behavior that conflicts with the PRD.

Indexes:

- "created_at"
- "updated_at"
- "status"

6.3 "messages"

Use this table only if the PRD requires persisted conversations.

Column| Type| Constraints
"id"| UUID string| Primary key
"conversation_id"| UUID string| Foreign key to "conversations.id", not null
"role"| String(30)| Not null, defined values
"content"| Text| Not null
"metadata_json"| JSON| Nullable
"created_at"| UTC datetime| Not null

Allowed roles must be explicitly defined by the existing AI conversation protocol. Typical values include "user", "assistant", and "system"; tool messages must follow the protocol already adopted by the project.

Rules:

- Never treat message text as trusted instructions for database operations.
- Do not use message content to construct SQL queries.
- Validate metadata before persistence.
- Do not log complete message contents by default.
- Establish a documented deletion and retention policy.
- If attachments are supported, store their metadata and controlled file references separately rather than embedding arbitrary binary content into message rows.

Indexes:

- "(conversation_id, created_at)"
- "role"
- "created_at"

6.4 "agents"

Use this table only if the PRD includes configurable or persistent agent definitions.

Column| Type| Constraints
"id"| UUID string| Primary key
"name"| String(120)| Not null
"agent_type"| String(80)| Not null
"status"| String(30)| Not null
"config_json"| JSON| Not null
"created_at"| UTC datetime| Not null
"updated_at"| UTC datetime| Not null

Rules:

- Define the allowed statuses in one shared enum or validation schema.
- Validate "config_json" against the agent type's schema.
- Keep credentials outside "config_json".
- Never grant an agent unrestricted database or operating-system access through configuration.
- Preserve the permission model established by the PRD.

6.5 "agent_runs"

Use this table only if agent execution history is a required feature.

Column| Type| Constraints
"id"| UUID string| Primary key
"agent_id"| UUID string| Foreign key to "agents.id", not null
"status"| String(30)| Not null
"input_json"| JSON| Nullable
"result_json"| JSON| Nullable
"error_code"| String(100)| Nullable
"started_at"| UTC datetime| Not null
"finished_at"| UTC datetime| Nullable

Possible statuses:

- "pending"
- "running"
- "succeeded"
- "failed"
- "cancelled"

Rules:

- Enforce valid state transitions in the service layer.
- "finished_at" must be null while a run is active.
- A completed run must have a valid completion timestamp.
- Sanitize errors before persistence.
- Do not persist secrets or unrestricted provider responses by default.
- Establish indexes on "(agent_id, started_at)" and "(status, started_at)".

6.6 "tasks"

Use this table only if the PRD requires persistent tasks, reminders, or scheduled work.

Column| Type| Constraints
"id"| UUID string| Primary key
"title"| String(200)| Not null
"status"| String(30)| Not null
"payload_json"| JSON| Nullable
"scheduled_at"| UTC datetime| Nullable
"created_at"| UTC datetime| Not null
"updated_at"| UTC datetime| Not null

Rules:

- Define task statuses and scheduling semantics according to the PRD.
- Store scheduled instants in UTC.
- Preserve any required original timezone separately when recurring local-time scheduling needs it.
- Avoid executing a task twice after restart unless the task's execution policy explicitly permits retries.
- Use database transactions to claim or transition tasks.
- Keep execution state separate from UI presentation state where appropriate.

6.7 "audit_events"

Use this table if the PRD requires an audit trail for security-sensitive or administrative operations.

Column| Type| Constraints
"id"| UUID string| Primary key
"event_type"| String(100)| Not null
"actor_type"| String(50)| Not null
"actor_id"| String(120)| Nullable
"details_json"| JSON| Not null
"created_at"| UTC datetime| Not null

Rules:

- Record only events necessary for security, diagnostics, or product functionality.
- Exclude secrets, raw authentication tokens, and unnecessary personal content.
- Do not claim that an ordinary SQLite table is tamper-proof.
- Protect access through the backend and operating-system file permissions.
- Apply the approved retention policy.

---

7. Relationships and deletion policy

Relationships must be explicit in SQLAlchemy models and protected by SQLite foreign-key constraints.

Recommended baseline:

conversations
    |
    +---- messages

agents
    |
    +---- agent_runs

Tasks and audit events may have additional relationships only when required by the PRD.

7.1 Foreign keys

Enable SQLite foreign-key enforcement on every database connection.

Never assume foreign keys are active merely because SQLAlchemy models declare them.

7.2 Cascading deletion

Use "ON DELETE CASCADE" only when deleting the parent is explicitly intended to delete all dependent records.

For retained audit events or records requiring independent lifecycle management, use restrictive foreign keys or an approved archival process.

Do not configure cascading deletion across unrelated data domains.

7.3 Indexes

Add indexes for:

- Frequently filtered status columns.
- Foreign-key columns used in joins.
- Timestamp columns used for chronological queries.
- Composite query patterns verified through actual application usage.

Avoid creating an index for every column. Indexes increase storage and write costs.

Review important queries using SQLite's "EXPLAIN QUERY PLAN".

---

8. SQLAlchemy 2.x implementation

8.1 Declarative base

Use typed declarative mappings with "Mapped" and "mapped_column".

from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AppSetting(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    key: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        nullable=False,
    )

    value_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

This is a minimal example. Production models must include the remaining schema, explicit constraint names, appropriate type validation, and the project's chosen timestamp storage strategy.

Do not assume "DateTime(timezone=True)" alone guarantees timezone preservation in SQLite. Normalize UTC values consistently.

8.2 Session factory

Use one engine per application database configuration and a session factory for database work.

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./jarvis.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(
    dbapi_connection,
    connection_record,
):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

The URL above is illustrative only. Production must use the resolved absolute database path.

"check_same_thread=False" permits connection use across threads under the driver's rules; it does not make a SQLAlchemy session thread-safe. Never share a "Session" instance between concurrent requests or tasks.

8.3 FastAPI dependency

Create and close a session for each unit of work.

from collections.abc import Generator
from sqlalchemy.orm import Session


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session

The service layer owns transaction boundaries. The dependency must not silently commit every request regardless of its outcome.

For asynchronous routes, do not call blocking SQLite operations directly in a way that blocks the event loop. Use the existing approved synchronous execution strategy or adopt "AsyncSession" consistently.

---

9. Transaction management

9.1 Atomic operations

Every logical database operation that changes multiple related rows must execute in a single transaction where atomicity is required.

Examples:

- Creating a conversation and its initial messages.
- Recording an agent execution and updating its state.
- Updating a task and recording its completion.
- Updating settings that must change together.

Use SQLAlchemy transaction contexts.

from sqlalchemy.orm import Session


def update_setting(
    session: Session,
    key: str,
    value: dict,
) -> None:
    with session.begin():
        setting = session.query(AppSetting).filter_by(
            key=key
        ).one_or_none()

        if setting is None:
            setting = AppSetting(
                key=key,
                value_json=value,
            )
            session.add(setting)
        else:
            setting.value_json = value

In a real service, account for an already-active transaction rather than nesting "session.begin()" indiscriminately. Prefer a clearly defined service-level transaction boundary.

9.2 Rollback

If a transaction fails:

- Roll back the complete transaction.
- Do not return a success response.
- Record a sanitized error.
- Leave related records in a consistent state.
- Re-raise or translate the exception into the application's established error format.

A failed SQLAlchemy flush can leave a session requiring rollback before it can be reused.

9.3 SQLite concurrency

SQLite permits multiple readers but serializes database writers.

Therefore:

- Keep write transactions short.
- Do not hold a transaction open while waiting for an LLM response, network request, user interaction, or long-running computation.
- Never share sessions between threads.
- Handle "SQLITE_BUSY" or lock errors using bounded retries with backoff where safe.
- Retry only operations whose transaction semantics make retrying safe.
- Avoid uncontrolled nested transactions.

9.4 WAL mode

Write-Ahead Logging may be enabled after testing the deployment environment.

Benefits include improved reader/writer concurrency, but WAL creates associated "-wal" and "-shm" files while active.

If WAL is enabled:

- Configure it through a controlled database initialization procedure.
- Keep all related files under the same protected application-data directory.
- Use SQLite's supported backup API for consistent backups.
- Do not copy only the main ".db" file while active and assume the copy is complete.
- Test checkpointing and shutdown behavior.

9.5 Busy timeout

Configure a reasonable SQLite busy timeout and verify it under concurrent access tests.

Do not use a long timeout to conceal persistent transaction or locking problems.

---

10. Pydantic validation

Pydantic validates incoming data; SQLAlchemy persists it; SQLite constraints enforce important invariants.

All three layers have different responsibilities.

10.1 Input schema example

from pydantic import BaseModel, ConfigDict, Field


class AppSettingInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(
        min_length=1,
        max_length=120,
        pattern=r"^[a-zA-Z0-9_.-]+$",
    )

    value_json: dict

This example accepts object-valued settings. If the PRD requires arrays, scalar values, or more specific settings, define an explicit schema for each setting instead of weakening validation globally.

10.2 Validation requirements

- Reject unknown fields where the API contract requires strict input.
- Validate maximum string lengths.
- Validate enumerated states.
- Validate identifiers and referenced entities.
- Validate JSON structures and maximum payload sizes.
- Reject invalid state transitions.
- Normalize timestamps before persistence.
- Prevent mass assignment of protected columns.
- Never trust data merely because it came from the frontend.
- Validate data loaded from external AI providers before saving it.

Database constraints remain necessary even when Pydantic validation exists.

10.3 Error handling

Convert expected validation and integrity errors into stable application error responses.

Do not return raw SQL statements, database paths, secrets, or complete exception traces to the UI.

Detailed diagnostics may be written to protected logs with sensitive values redacted.

---

11. Alembic migrations

11.1 Single source of truth

Alembic migrations define the production schema history.

The SQLAlchemy models describe the current schema, while migrations describe how existing databases reach that schema.

Never modify an already-applied migration to change the structure of an existing release. Create a new migration instead.

11.2 Repository layout

backend/
├── app/
│   ├── db/
│   │   ├── base.py
│   │   ├── engine.py
│   │   ├── session.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── app_setting.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── agent.py
│   │   │   └── task.py
│   │   ├── repositories/
│   │   └── services/
│   └── main.py
├── alembic/
│   ├── env.py
│   └── versions/
├── alembic.ini
└── tests/
    └── db/

Adapt this layout to the existing repository rather than duplicating established modules or renaming paths unnecessarily.

11.3 Initial setup

Initialize Alembic once:

alembic init alembic

Configure "alembic/env.py" to import the project's declarative base and all model modules so that "Base.metadata" contains the complete schema.

Configure the database URL through the existing configuration system. Do not commit machine-specific absolute paths or secrets.

11.4 Generate migrations

alembic revision --autogenerate -m "create initial schema"

Review every generated migration before applying it.

Autogeneration does not reliably infer every rename, data migration, constraint change, or semantic change. Never apply generated migrations without review.

11.5 Apply migrations

alembic upgrade head

Inspect the current revision:

alembic current

Review migration history:

alembic history

Run migration commands through a controlled startup or maintenance process. Prevent concurrent application instances from attempting schema upgrades simultaneously.

11.6 Migration requirements

Each migration must:

- Have a unique revision identifier.
- Declare the correct parent revision.
- Implement the intended schema transition.
- Preserve existing data unless deletion is explicitly required.
- Include data transformations when needed.
- Define a downgrade path where it is safe and meaningful.
- Be tested against a realistic prior schema.
- Be tested on the SQLite version used by the application.
- Avoid unbounded work during normal application startup.

11.7 SQLite-specific migration limitations

SQLite has limitations around altering existing tables, constraints, and certain column definitions.

When necessary, use Alembic's batch operations:

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    with op.batch_alter_table("app_settings") as batch_op:
        batch_op.add_column(
            sa.Column(
                "description",
                sa.String(250),
                nullable=True,
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("app_settings") as batch_op:
        batch_op.drop_column("description")

This is an illustrative migration only. Do not add a column unless the approved schema requires it.

For non-nullable columns added to existing populated tables, use a safe sequence:

1. Add the column as nullable or with a valid database-level default.
2. Backfill existing rows.
3. Validate the backfilled values.
4. Enforce the final non-null constraint through a tested SQLite-compatible migration.

Never assume an SQLite "ALTER TABLE" operation behaves identically to PostgreSQL.

11.8 Migration startup policy

For desktop production builds:

- Verify the current database revision.
- Back up the database before risky upgrades.
- Apply migrations through a single controlled process.
- Stop normal database writes if migration fails.
- Preserve the original data.
- Show a recovery-oriented diagnostic.
- Do not automatically downgrade after a failed upgrade without a tested recovery procedure.

---

12. Backup and restore

12.1 Backup objectives

Backups must produce a consistent, recoverable SQLite database.

The backup mechanism must account for active connections, pending writes, WAL files, and database migrations.

12.2 Backup implementation

Prefer Python's SQLite backup API.

import sqlite3
from pathlib import Path


def backup_database(
    source_path: Path,
    destination_path: Path,
) -> None:
    destination_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if source_path.resolve() == destination_path.resolve():
        raise ValueError(
            "Source and destination must differ."
        )

    source = sqlite3.connect(
        f"{source_path.resolve().as_uri()}?mode=ro",
        uri=True,
    )

    try:
        destination = sqlite3.connect(
            str(destination_path)
        )
        try:
            source.backup(destination)
        finally:
            destination.close()
    finally:
        source.close()

    with sqlite3.connect(str(destination_path)) as db:
        result = db.execute(
            "PRAGMA integrity_check"
        ).fetchone()

        if not result or result[0] != "ok":
            destination_path.unlink(missing_ok=True)
            raise RuntimeError(
                "Backup integrity validation failed."
            )

The implementation must also validate the source path, reject invalid destination locations, handle partial-file cleanup, and ensure backup operations cannot overwrite protected files unexpectedly.

Run this function with the correct URI construction and file handling for the supported platforms. Never accept arbitrary user-controlled SQLite URIs.

12.3 Backup metadata

Maintain a manifest alongside each backup when required by the PRD or operational policy.

Suggested metadata:

- Backup creation time in UTC.
- Application version.
- Alembic revision.
- Database file size.
- Integrity-check result.
- Optional checksum.
- Backup format/version.

Do not place sensitive user content in the manifest.

12.4 Restore procedure

Restore must be a controlled maintenance operation.

1. Stop or pause new database writes.
2. Close active sessions and connections.
3. Preserve the current database as a recovery copy.
4. Validate the selected backup.
5. Verify the backup's schema revision and compatibility.
6. Restore into a temporary file or staging location.
7. Run SQLite integrity and foreign-key checks.
8. Apply only the migrations required by the approved restore policy.
9. Replace the live database using a safe, platform-appropriate file operation.
10. Reinitialize the engine and session factory.
11. Run application-level health checks.
12. Preserve recovery files until successful verification.

Do not overwrite the live database with an unvalidated file.

If restore fails, retain the original database and provide a clear recovery path.

12.5 Retention

Implement backup retention only according to the approved PRD or operational policy.

Never delete the last known-good backup before a newer backup has been verified.

Backups may contain the same sensitive information as the live database and require equivalent filesystem protection.

---

13. Security and privacy

- Store database files in a user-private application-data directory.
- Use operating-system permissions and supported filesystem protections.
- Keep credentials in the approved secret-storage mechanism, not in ordinary settings tables.
- Never store API keys in plaintext logs.
- Avoid logging full conversation bodies or sensitive agent inputs.
- Validate all database-facing requests.
- Use SQLAlchemy expressions or bound parameters instead of string-built SQL.
- Protect database maintenance operations behind the backend's existing authorization controls.
- Validate any imported backup before restoring it.
- Do not execute SQL or application code embedded in imported JSON.
- Follow the existing PRD's memory, conversation, deletion, and retention requirements.

If a future feature introduces encryption at rest, define its key management, recovery, migration, and failure behavior in the relevant security specification. Do not claim that ordinary SQLite automatically encrypts the database file.

---

14. Data consistency and integrity

14.1 Required checks

At minimum, the database health-check process should evaluate:

PRAGMA integrity_check;
PRAGMA foreign_key_check;

"integrity_check" must return "ok" for a healthy database.

"foreign_key_check" must return no violation rows.

Run expensive integrity checks at appropriate maintenance points rather than necessarily on every application request.

14.2 Uniqueness

Use database-level unique constraints for values that must be unique, including setting keys and any additional identifiers defined by the PRD.

Do not rely exclusively on checking whether a value exists before insertion. Concurrent writes can invalidate that assumption.

14.3 State consistency

Where appropriate, enforce allowed values with SQLAlchemy enums or named "CHECK" constraints.

SQLite enum behavior must be verified against the generated SQL. Application validation alone is insufficient for important invariants.

For state transitions that require more than a simple allowed-value check, implement explicit service-layer transition rules and transaction tests.

---

15. Automated testing

Use "pytest" for unit, integration, migration, and recovery tests.

The database test suite must use isolated temporary databases. Tests must not mutate a developer's production database.

15.1 Model tests

Verify:

- Model metadata imports successfully.
- Primary keys are generated correctly.
- Required fields reject missing values.
- Unique constraints are enforced.
- Foreign-key enforcement is active.
- Invalid state values are rejected.
- Timestamp normalization works.
- JSON validation works as intended.

15.2 Transaction tests

Verify:

- Successful transactions commit.
- Failed transactions roll back.
- Related inserts are atomic.
- Constraint violations do not leave partial data.
- Failed sessions are rolled back before reuse.
- Concurrent writes fail or retry safely under documented conditions.

15.3 Migration tests

For every migration release:

1. Create a database using the previous released schema.
2. Populate representative valid data.
3. Run the upgrade to the target revision.
4. Verify the target Alembic revision.
5. Verify expected tables, columns, indexes, and constraints.
6. Verify that pre-existing data remains valid.
7. Run integrity and foreign-key checks.
8. Test downgrade only when the downgrade is supported.
9. Verify upgrade and downgrade behavior using the supported SQLite runtime.

Never treat "Base.metadata.create_all()" as a migration test.

15.4 Migration command tests

Run the following against a disposable test database:

alembic upgrade head
alembic current
alembic history

The test suite must also detect model/migration drift through reviewed autogeneration checks or equivalent schema comparisons.

15.5 Backup/restore tests

Verify:

- Backup produces a valid database.
- Backup works while the supported connection pattern is active.
- WAL-related data is included consistently when WAL is enabled.
- Invalid backups are rejected.
- Restore preserves expected rows and relationships.
- Foreign-key checks pass after restoration.
- Failed restore does not destroy the live database.
- Recovery behavior works after an interrupted restore simulation.
- Backups from supported older revisions follow the documented migration procedure.

15.6 API integration tests

Verify:

- Valid requests persist correctly.
- Invalid requests return the established validation response.
- Database exceptions do not expose internal details.
- Failed requests do not commit unintended changes.
- Each request uses an appropriately scoped session.
- Existing authentication and permission rules remain effective.

15.7 Example test commands

pytest tests/db -q
pytest tests/api -q
pytest --cov=app --cov-report=term-missing

Adjust module paths to match the existing repository.

Tests must run without real API keys, external LLM calls, or access to production user data.

---

16. Performance and maintenance

Start with SQLite and optimize based on measured workload.

Required practices:

- Use indexes for proven query patterns.
- Avoid N+1 ORM query patterns.
- Paginate large message or execution histories.
- Use bounded result sets for logs and history.
- Keep transactions short.
- Monitor database file size and write latency.
- Use SQLite-supported maintenance commands where appropriate.
- Consider WAL only after concurrency testing.
- Use "EXPLAIN QUERY PLAN" for slow queries.

Do not add Redis, PostgreSQL, a separate database server, or another persistence dependency unless the approved architecture or measured requirements justify it.

If multi-process or concurrent write workloads eventually exceed SQLite's practical limits, evaluate a database migration separately. Do not silently switch database engines.

---

17. Operational error handling

Define stable internal error categories for:

- Database unavailable.
- Schema revision mismatch.
- Migration failure.
- Integrity violation.
- Constraint violation.
- Database locked or busy.
- Backup failure.
- Restore failure.
- Corrupt or invalid database.
- Invalid persisted configuration.

For each error:

1. Roll back where applicable.
2. Record a sanitized diagnostic.
3. Preserve user data.
4. Avoid false success responses.
5. Expose only safe, actionable information to the frontend.
6. Provide a recovery path where possible.

Do not automatically delete the database, erase migrations, or regenerate a fresh database after a startup error.

---

18. Definition of done

The database subsystem is ready when all applicable requirements below pass.

- [ ] SQLAlchemy 2.x models use the project's declarative base.
- [ ] SQLite foreign-key enforcement is enabled and tested.
- [ ] The database is stored in the correct application-data directory.
- [ ] Alembic is the authoritative schema migration mechanism.
- [ ] Fresh database initialization succeeds.
- [ ] Upgrades from supported previous revisions succeed.
- [ ] Migration failures do not silently destroy user data.
- [ ] Pydantic validation covers database-facing inputs.
- [ ] Transactions commit and roll back correctly.
- [ ] No SQLAlchemy session is shared unsafely across concurrent work.
- [ ] Backup creation and integrity validation succeed.
- [ ] Restore succeeds from a valid supported backup.
- [ ] Failed restore preserves a recovery copy.
- [ ] Integrity and foreign-key checks pass.
- [ ] Automated model, transaction, migration, and backup tests pass.
- [ ] Database exceptions do not expose secrets or internal paths.
- [ ] Optional schema modules match the approved PRD.
- [ ] No unauthorized changes to the frontend/backend architecture were introduced.
- [ ] Dependency versions and migration files are version-controlled.

---

19. Implementation order

Follow this sequence to minimize schema drift and recovery risk.

1. Review the approved PRD and existing repository structure.
2. Confirm the persistence requirements and identify optional feature modules.
3. Establish the application-data directory and database configuration.
4. Implement the declarative base, engine, session factory, and connection settings.
5. Implement only the required SQLAlchemy models.
6. Configure Alembic and create the initial migration.
7. Implement Pydantic validation and repository/service transaction boundaries.
8. Implement database health checks and sanitized error handling.
9. Implement consistent backup and controlled restore.
10. Add migration, transaction, validation, and recovery tests.
11. Run the full test suite against fresh and previously migrated databases.
12. Verify integration with the existing FastAPI and Tauri application.

Final architecture rule

SQLAlchemy models define the current application mapping. Alembic migrations define schema evolution. Pydantic validates data contracts. SQLite enforces persistent database constraints. The service layer controls transactions and business rules.

These responsibilities must remain separate, and every implementation decision must remain compatible with the approved JARVIS PRD.