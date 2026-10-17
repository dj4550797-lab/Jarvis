"""Persistent Memory Management Service.

Implements PRD Section 11 & SECURITY.md Section 11:
- Storage and retrieval of user facts, preferences, project context, and inferences
- Search and pagination
- Explicit clear confirmation flow
- Audit logging for all state mutations
- Prompt context generation with uncertainty disclosure
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.memory.security import validate_memory_content
from app.models.audit import AuditLog
from app.models.memory import Memory
from app.utils.logging import logger


class MemoryService:
    """Service layer managing persistent memories."""

    @staticmethod
    def create_memory(
        db: Session,
        content: str,
        memory_type: str = "explicit_fact",
        category: str | None = None,
        is_uncertain: bool = False,
        confidence: float = 1.0,
        source: str = "user",
        tags: list[str] | None = None,
    ) -> Memory:
        """Create a new memory item after validating for credentials."""
        # Security validation against secrets/credentials
        validate_memory_content(content)

        memory_id = str(uuid.uuid4())
        mem = Memory(
            id=memory_id,
            content=content.strip(),
            memory_type=memory_type,
            category=category,
            is_uncertain=is_uncertain,
            confidence=max(0.0, min(1.0, confidence)),
            source=source,
            tags_json=json.dumps(tags or []),
        )
        db.add(mem)

        # Audit log creation
        audit = AuditLog(
            id=str(uuid.uuid4()),
            event_type="MEMORY_CREATE",
            severity="INFO",
            component="memory_service",
            message=f"Created memory '{memory_id}' of type '{memory_type}'",
            details=json.dumps({"type": memory_type, "uncertain": is_uncertain, "category": category}),
        )
        db.add(audit)
        db.commit()
        db.refresh(mem)
        logger.info("Memory created: %s (type=%s, uncertain=%s)", memory_id, memory_type, is_uncertain)
        return mem

    @staticmethod
    def get_memory(db: Session, memory_id: str) -> Memory | None:
        """Get a single memory by ID."""
        stmt = select(Memory).where(Memory.id == memory_id)
        return db.scalars(stmt).first()

    @staticmethod
    def list_memories(
        db: Session,
        query: str | None = None,
        memory_type: str | None = None,
        category: str | None = None,
        is_uncertain: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Memory], int]:
        """List and search memories with pagination and filters."""
        stmt = select(Memory)

        if query and query.strip():
            search_term = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(
                    Memory.content.ilike(search_term),
                    Memory.tags_json.ilike(search_term),
                    Memory.category.ilike(search_term),
                )
            )

        if memory_type:
            stmt = stmt.where(Memory.memory_type == memory_type)

        if category:
            stmt = stmt.where(Memory.category == category)

        if is_uncertain is not None:
            stmt = stmt.where(Memory.is_uncertain == is_uncertain)

        # Count total matches
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.scalar(count_stmt) or 0

        # Paginate ordered by latest updated
        stmt = stmt.order_by(Memory.updated_at.desc()).offset(offset).limit(limit)
        items = list(db.scalars(stmt).all())
        return items, total

    @staticmethod
    def update_memory(
        db: Session,
        memory_id: str,
        content: str | None = None,
        memory_type: str | None = None,
        category: str | None = None,
        is_uncertain: bool | None = None,
        confidence: float | None = None,
        tags: list[str] | None = None,
    ) -> Memory | None:
        """Update an existing memory item."""
        mem = MemoryService.get_memory(db, memory_id)
        if not mem:
            return None

        if content is not None:
            validate_memory_content(content)
            mem.content = content.strip()

        if memory_type is not None:
            mem.memory_type = memory_type

        if category is not None:
            mem.category = category

        if is_uncertain is not None:
            mem.is_uncertain = is_uncertain

        if confidence is not None:
            mem.confidence = max(0.0, min(1.0, confidence))

        if tags is not None:
            mem.tags = tags

        audit = AuditLog(
            id=str(uuid.uuid4()),
            event_type="MEMORY_UPDATE",
            severity="INFO",
            component="memory_service",
            message=f"Updated memory '{memory_id}'",
            details=json.dumps({"updated_fields": [k for k, v in locals().items() if v is not None and k not in ("db", "memory_id", "mem", "audit")]}),
        )
        db.add(audit)
        db.commit()
        db.refresh(mem)
        logger.info("Memory updated: %s", memory_id)
        return mem

    @staticmethod
    def delete_memory(db: Session, memory_id: str) -> bool:
        """Delete an individual memory item."""
        mem = MemoryService.get_memory(db, memory_id)
        if not mem:
            return False

        db.delete(mem)
        audit = AuditLog(
            id=str(uuid.uuid4()),
            event_type="MEMORY_DELETE",
            severity="WARNING",
            component="memory_service",
            message=f"Deleted memory '{memory_id}'",
        )
        db.add(audit)
        db.commit()
        logger.info("Memory deleted: %s", memory_id)
        return True

    @staticmethod
    def clear_all_memories(db: Session) -> int:
        """Clear all stored memories after explicit confirmation."""
        count_stmt = select(func.count(Memory.id))
        total = db.scalar(count_stmt) or 0

        db.execute(delete(Memory))

        audit = AuditLog(
            id=str(uuid.uuid4()),
            event_type="MEMORY_CLEAR",
            severity="CRITICAL",
            component="memory_service",
            message=f"Bulk cleared {total} memory records",
        )
        db.add(audit)
        db.commit()
        logger.warning("All persistent memories cleared (%d records deleted)", total)
        return total

    @staticmethod
    def export_memories(db: Session) -> dict[str, Any]:
        """Export all memories as structured dictionary for backup and transparency."""
        stmt = select(Memory).order_by(Memory.created_at.asc())
        memories = list(db.scalars(stmt).all())

        return {
            "version": "1.0",
            "total_records": len(memories),
            "memories": [
                {
                    "id": m.id,
                    "content": m.content,
                    "memory_type": m.memory_type,
                    "category": m.category,
                    "is_uncertain": m.is_uncertain,
                    "confidence": m.confidence,
                    "source": m.source,
                    "tags": m.tags,
                    "created_at": m.created_at.isoformat(),
                    "updated_at": m.updated_at.isoformat(),
                }
                for m in memories
            ],
        }

    @staticmethod
    def get_prompt_context(db: Session, limit: int = 15) -> str:
        """Generate structured context for AI prompts respecting PRD 11.1 honesty rule."""
        stmt = (
            select(Memory)
            .order_by(Memory.is_uncertain.asc(), Memory.confidence.desc(), Memory.updated_at.desc())
            .limit(limit)
        )
        memories = list(db.scalars(stmt).all())
        if not memories:
            return ""

        facts_and_prefs: list[str] = []
        uncertain_inferences: list[str] = []

        for m in memories:
            if m.is_uncertain or m.memory_type == "inferred":
                conf_pct = int(m.confidence * 100)
                uncertain_inferences.append(f"• [Inferred Context - {conf_pct}% confidence]: {m.content}")
            else:
                tag = m.memory_type.replace("_", " ").title()
                facts_and_prefs.append(f"• [{tag}]: {m.content}")

        sections: list[str] = ["[Persistent Memory Context]"]
        if facts_and_prefs:
            sections.append("Confirmed User Facts & Preferences:\n" + "\n".join(facts_and_prefs))
        if uncertain_inferences:
            sections.append(
                "Uncertain Inferences (Honesty Rule: Do not present these as confirmed facts without user confirmation):\n"
                + "\n".join(uncertain_inferences)
            )

        return "\n\n".join(sections)
