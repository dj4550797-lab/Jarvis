"""Research Management and Structured Evidence Service.

Complies with Phase 7 requirements, PRD Section 18, and SECURITY.md:
- Structured research sessions with topics, notes, and citations
- Strict Honesty Rule: explicitly segregates verified facts from uncertain claims
- Source traceability with URLs, snippets, and confidence levels
- Formatted report exports (Markdown, JSON)
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.coding_research import ResearchSession, ResearchSource
from app.utils.logging import logger


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ResearchService:
    """Manages research sessions, factual evidence, citations, and report exports."""

    @staticmethod
    def create_session(
        db: Session,
        title: str,
        topic: str,
        summary: str | None = None,
    ) -> ResearchSession:
        """Create a new research session."""
        if not title or not title.strip():
            raise ValueError("Research session title cannot be empty")
        if not topic or not topic.strip():
            raise ValueError("Research session topic cannot be empty")

        session = ResearchSession(
            id=str(uuid.uuid4()),
            title=title.strip(),
            topic=topic.strip(),
            status="active",
            summary=summary.strip() if summary else None,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info("Created research session '%s' (id=%s)", session.title, session.id)
        return session

    @staticmethod
    def list_sessions(
        db: Session,
        status: str | None = None,
        limit: int = 50,
    ) -> list[ResearchSession]:
        """List research sessions with optional status filter."""
        stmt = select(ResearchSession).order_by(ResearchSession.updated_at.desc())
        if status:
            stmt = stmt.where(ResearchSession.status == status)
        stmt = stmt.limit(limit)
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_session(db: Session, session_id: str) -> ResearchSession | None:
        """Retrieve a research session by ID with its sources."""
        stmt = select(ResearchSession).where(ResearchSession.id == session_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def update_session(
        db: Session,
        session_id: str,
        title: str | None = None,
        topic: str | None = None,
        status: str | None = None,
        summary: str | None = None,
    ) -> ResearchSession:
        """Update research session metadata."""
        session = db.execute(
            select(ResearchSession).where(ResearchSession.id == session_id)
        ).scalar_one_or_none()
        if not session:
            raise ValueError(f"Research session '{session_id}' not found")

        if title is not None:
            if not title.strip():
                raise ValueError("Session title cannot be empty")
            session.title = title.strip()
        if topic is not None:
            if not topic.strip():
                raise ValueError("Session topic cannot be empty")
            session.topic = topic.strip()
        if status is not None:
            if status not in {"active", "completed", "archived"}:
                raise ValueError(f"Invalid status '{status}'. Must be active, completed, or archived.")
            session.status = status
        if summary is not None:
            session.summary = summary.strip() if summary else None

        session.updated_at = utc_now()
        db.commit()
        db.refresh(session)
        logger.info("Updated research session '%s' (id=%s)", session.title, session.id)
        return session

    @staticmethod
    def delete_session(db: Session, session_id: str) -> bool:
        """Delete a research session and all associated sources."""
        session = db.execute(
            select(ResearchSession).where(ResearchSession.id == session_id)
        ).scalar_one_or_none()
        if not session:
            return False

        db.delete(session)
        db.commit()
        logger.info("Deleted research session id=%s", session_id)
        return True

    @staticmethod
    def add_source(
        db: Session,
        session_id: str,
        title: str,
        snippet: str,
        url: str | None = None,
        is_verified: bool = False,
        confidence: float = 1.0,
        notes: str | None = None,
    ) -> ResearchSource:
        """Add an evidence item or citation to a research session."""
        session = db.execute(
            select(ResearchSession).where(ResearchSession.id == session_id)
        ).scalar_one_or_none()
        if not session:
            raise ValueError(f"Research session '{session_id}' not found")

        if not title or not title.strip():
            raise ValueError("Source title cannot be empty")
        if not snippet or not snippet.strip():
            raise ValueError("Source snippet cannot be empty")

        source = ResearchSource(
            id=str(uuid.uuid4()),
            session_id=session_id,
            url=url.strip() if url else None,
            title=title.strip(),
            snippet=snippet.strip(),
            is_verified=bool(is_verified),
            confidence=max(0.0, min(1.0, float(confidence))),
            notes=notes.strip() if notes else None,
            created_at=utc_now(),
        )
        db.add(source)
        session.updated_at = utc_now()
        db.commit()
        db.refresh(source)
        logger.info(
            "Added source '%s' (verified=%s, confidence=%.2f) to session %s",
            source.title,
            source.is_verified,
            source.confidence,
            session_id,
        )
        return source

    @staticmethod
    def delete_source(db: Session, source_id: str) -> bool:
        """Delete an evidence item by ID."""
        source = db.execute(
            select(ResearchSource).where(ResearchSource.id == source_id)
        ).scalar_one_or_none()
        if not source:
            return False

        session_id = source.session_id
        db.delete(source)

        session = db.execute(
            select(ResearchSession).where(ResearchSession.id == session_id)
        ).scalar_one_or_none()
        if session:
            session.updated_at = utc_now()

        db.commit()
        logger.info("Deleted research source id=%s from session %s", source_id, session_id)
        return True

    @classmethod
    def export_report(
        cls,
        db: Session,
        session_id: str,
        export_format: str = "markdown",
    ) -> dict[str, Any]:
        """Export research findings to formatted Markdown or JSON."""
        session = cls.get_session(db, session_id)
        if not session:
            raise ValueError(f"Research session '{session_id}' not found")

        if export_format == "json":
            return {
                "session_id": session.id,
                "format": "json",
                "content": json.dumps(session.to_dict(include_sources=True), indent=2),
                "filename": f"research_report_{session.id[:8]}.json",
            }

        # Build Markdown report adhering to Strict Honesty Rule
        verified_sources = [s for s in session.sources if s.is_verified]
        uncertain_sources = [s for s in session.sources if not s.is_verified]

        created_str = session.created_at.strftime("%Y-%m-%d %H:%M UTC") if session.created_at else "Unknown"
        updated_str = session.updated_at.strftime("%Y-%m-%d %H:%M UTC") if session.updated_at else "Unknown"

        md_lines = [
            f"# Research Report: {session.title}",
            "",
            f"**Topic:** {session.topic}  ",
            f"**Status:** `{session.status.upper()}`  ",
            f"**Created:** {created_str} | **Last Updated:** {updated_str}  ",
            "",
            "## Executive Summary",
            "",
            session.summary or "_No executive summary provided for this research session._",
            "",
            "---",
            "",
            "## 1. Verified Facts & Empirical Evidence",
            "",
            "> [!NOTE]",
            "> All items in this section have been confirmed with verifiable citations.",
            "",
        ]

        if verified_sources:
            for idx, s in enumerate(verified_sources, start=1):
                md_lines.append(f"### 1.{idx} {s.title}")
                if s.url:
                    md_lines.append(f"**Source URL:** [{s.url}]({s.url})")
                md_lines.append(f"**Confidence:** `{int(s.confidence * 100)}%`")
                md_lines.append("")
                md_lines.append(f"> {s.snippet}")
                md_lines.append("")
                if s.notes:
                    md_lines.append(f"**Analysis Notes:** {s.notes}")
                    md_lines.append("")
        else:
            md_lines.append("_No verified facts recorded yet._")
            md_lines.append("")

        md_lines.extend([
            "---",
            "",
            "## 2. Hypotheses & Uncertain Claims",
            "",
            "> [!WARNING]",
            "> Strict Honesty Rule: The following items are unverified hypotheses or tentative claims requiring further verification before operational reliance.",
            "",
        ])

        if uncertain_sources:
            for idx, s in enumerate(uncertain_sources, start=1):
                md_lines.append(f"### 2.{idx} [UNVERIFIED] {s.title}")
                if s.url:
                    md_lines.append(f"**Source URL:** [{s.url}]({s.url})")
                md_lines.append(f"**Claimed Confidence:** `{int(s.confidence * 100)}%`")
                md_lines.append("")
                md_lines.append(f"> {s.snippet}")
                md_lines.append("")
                if s.notes:
                    md_lines.append(f"**Open Questions / Gaps:** {s.notes}")
                    md_lines.append("")
        else:
            md_lines.append("_No uncertain claims recorded._")
            md_lines.append("")

        md_lines.extend([
            "---",
            "",
            "## 3. Citations & References",
            "",
            "| # | Status | Title | Confidence | URL |",
            "|---|--------|-------|------------|-----|",
        ])

        for idx, s in enumerate(session.sources, start=1):
            status_badge = "✅ Verified" if s.is_verified else "⚠️ Uncertain"
            url_link = f"[Link]({s.url})" if s.url else "N/A"
            safe_title = s.title.replace("|", "/")
            md_lines.append(f"| {idx} | {status_badge} | {safe_title} | {int(s.confidence * 100)}% | {url_link} |")

        md_lines.extend([
            "",
            "---",
            "",
            "_Generated by JARVIS Research Assistant. All unverified claims have been explicitly isolated per Strict Honesty Rule._",
        ])

        markdown_content = "\n".join(md_lines)
        return {
            "session_id": session.id,
            "format": "markdown",
            "content": markdown_content,
            "filename": f"research_report_{session.id[:8]}.md",
        }
