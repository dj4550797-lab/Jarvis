"""Contextual Memory and Semantic Search Router."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from jarvis.core.logging import logger
from jarvis.database.connection import get_db_connection
from jarvis.schemas.memories import (
    MemoryCreate,
    MemoryResponse,
    MemorySearchRequest,
    MemorySearchResponse,
)

router = APIRouter(prefix="/memories", tags=["Contextual Memory"])


@router.post("", response_model=MemoryResponse, status_code=201)
async def create_memory(item: MemoryCreate) -> MemoryResponse:
    """Create and persist a new memory fact or preference."""
    memory_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    async with get_db_connection() as conn:
        cursor = await conn.execute(
            """
            INSERT INTO memories (
                id, memory_type, category, content, source_ref,
                importance, is_sensitive, created_at, last_accessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                memory_id,
                item.memory_type,
                item.category,
                item.content,
                item.source_ref,
                item.importance,
                1 if item.is_sensitive else 0,
                now.isoformat(),
                now.isoformat(),
            ),
        )
        rowid = cursor.lastrowid

        # Index in SQLite FTS5 table
        await conn.execute(
            "INSERT INTO memories_fts (rowid, content, category) VALUES (?, ?, ?);",
            (rowid, item.content, item.category),
        )

        await conn.commit()

    logger.info("Memory created: ID=%s Category=%s", memory_id, item.category)

    return MemoryResponse(
        id=memory_id,
        memory_type=item.memory_type,
        category=item.category,
        content=item.content,
        source_ref=item.source_ref,
        importance=item.importance,
        access_count=0,
        is_sensitive=item.is_sensitive,
        created_at=now,
        last_accessed_at=now,
    )


@router.get("", response_model=list[MemoryResponse])
async def list_memories(
    category: str | None = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[MemoryResponse]:
    """Retrieve persisted memories ordered by importance and access time."""
    async with get_db_connection() as conn:
        if category:
            cursor = await conn.execute(
                """
                SELECT id, memory_type, category, content, source_ref,
                       importance, access_count, is_sensitive,
                       created_at, last_accessed_at
                FROM memories
                WHERE category = ?
                ORDER BY importance DESC, last_accessed_at DESC
                LIMIT ? OFFSET ?;
                """,
                (category, limit, offset),
            )
        else:
            cursor = await conn.execute(
                """
                SELECT id, memory_type, category, content, source_ref,
                       importance, access_count, is_sensitive,
                       created_at, last_accessed_at
                FROM memories
                ORDER BY importance DESC, last_accessed_at DESC
                LIMIT ? OFFSET ?;
                """,
                (limit, offset),
            )
        rows = await cursor.fetchall()

    return [
        MemoryResponse(
            id=r["id"],
            memory_type=r["memory_type"],
            category=r["category"],
            content=r["content"],
            source_ref=r["source_ref"],
            importance=r["importance"],
            access_count=r["access_count"],
            is_sensitive=bool(r["is_sensitive"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            last_accessed_at=datetime.fromisoformat(r["last_accessed_at"]),
        )
        for r in rows
    ]


@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(req: MemorySearchRequest) -> MemorySearchResponse:
    """Execute SQLite FTS5 full-text search across memories."""
    # Sanitize FTS query string
    sanitized_q = "".join(c for c in req.query if c.isalnum() or c.isspace()).strip()
    if not sanitized_q:
        return MemorySearchResponse(query=req.query, results=[])

    fts_expression = f'"{sanitized_q}"*'

    async with get_db_connection() as conn:
        if req.category:
            cursor = await conn.execute(
                """
                SELECT m.id, m.memory_type, m.category, m.content, m.source_ref,
                       m.importance, m.access_count, m.is_sensitive,
                       m.created_at, m.last_accessed_at
                FROM memories m
                JOIN memories_fts fts ON m.rowid = fts.rowid
                WHERE memories_fts MATCH ? AND m.category = ?
                ORDER BY bm25(memories_fts)
                LIMIT ?;
                """,
                (fts_expression, req.category, req.top_k),
            )
        else:
            cursor = await conn.execute(
                """
                SELECT m.id, m.memory_type, m.category, m.content, m.source_ref,
                       m.importance, m.access_count, m.is_sensitive,
                       m.created_at, m.last_accessed_at
                FROM memories m
                JOIN memories_fts fts ON m.rowid = fts.rowid
                WHERE memories_fts MATCH ?
                ORDER BY bm25(memories_fts)
                LIMIT ?;
                """,
                (fts_expression, req.top_k),
            )
        rows = await cursor.fetchall()

        # Increment access count
        ids = [r["id"] for r in rows]
        if ids:
            placeholders = ",".join("?" for _ in ids)
            now = datetime.now(timezone.utc).isoformat()
            await conn.execute(
                f"""
                UPDATE memories
                SET access_count = access_count + 1, last_accessed_at = ?
                WHERE id IN ({placeholders});
                """,
                (now, *ids),
            )
            await conn.commit()

    results = [
        MemoryResponse(
            id=r["id"],
            memory_type=r["memory_type"],
            category=r["category"],
            content=r["content"],
            source_ref=r["source_ref"],
            importance=r["importance"],
            access_count=r["access_count"],
            is_sensitive=bool(r["is_sensitive"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            last_accessed_at=datetime.fromisoformat(r["last_accessed_at"]),
        )
        for r in rows
    ]

    return MemorySearchResponse(query=req.query, results=results)


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str) -> dict[str, str]:
    """Delete a memory record and purge it from the FTS5 index."""
    async with get_db_connection() as conn:
        cursor = await conn.execute("SELECT rowid FROM memories WHERE id = ?;", (memory_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Memory not found.")

        rowid = row[0]
        await conn.execute("DELETE FROM memories_fts WHERE rowid = ?;", (rowid,))
        await conn.execute("DELETE FROM memories WHERE id = ?;", (memory_id,))
        await conn.commit()

    return {"message": f"Memory '{memory_id}' deleted successfully."}
