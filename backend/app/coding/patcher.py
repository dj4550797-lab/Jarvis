"""Unified Diff Generation, Atomic Patch Application, and Rollback Subsystem.

Complies with Phase 7 requirements, PRD Section 17, and SECURITY.md:
- Pre-modification snapshots stored in database
- Unified diff generation (difflib)
- Atomic file write with temp file renaming
- One-click rollback restoring the exact previous state
"""

from __future__ import annotations

import difflib
import os
import tempfile
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.coding_research import CodeSnapshot
from app.tools.security import SandboxGuard
from app.utils.logging import logger


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CodePatcher:
    """Manages diff generation, atomic patching with snapshot preservation, and rollback."""

    @staticmethod
    def generate_diff(
        original: str,
        modified: str,
        filename: str = "file",
    ) -> str:
        """Produce standard unified diff text."""
        orig_lines = original.splitlines(keepends=True)
        mod_lines = modified.splitlines(keepends=True)

        diff = difflib.unified_diff(
            orig_lines,
            mod_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
            lineterm="",
        )
        return "".join(diff)

    @classmethod
    def apply_patch(
        cls,
        file_path: str,
        new_content: str,
        reason: str,
        db: Session,
    ) -> CodeSnapshot:
        """Atomically apply new content to a file after creating a rollback snapshot."""
        resolved = SandboxGuard.validate_path(file_path)

        # Read existing file content (empty if file is new)
        original_content = ""
        if os.path.exists(resolved):
            with open(resolved, "r", encoding="utf-8", errors="replace") as fp:
                original_content = fp.read()

        filename = os.path.basename(resolved)
        diff_text = cls.generate_diff(original_content, new_content, filename=filename)

        # 1. Create and persist snapshot in DB before modifying disk
        snapshot = CodeSnapshot(
            file_path=str(resolved),
            original_content=original_content,
            diff_patch=diff_text,
            reason=reason,
            restored=False,
            created_at=utc_now(),
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        # 2. Atomic write using temporary file in the same parent directory
        parent_dir = os.path.dirname(resolved)
        os.makedirs(parent_dir, exist_ok=True)

        fd, temp_path = tempfile.mkstemp(dir=parent_dir, prefix="jarvis_patch_")
        try:
            with open(fd, "w", encoding="utf-8", newline="") as temp_fp:
                temp_fp.write(new_content)
            # Atomic rename / replace
            os.replace(temp_path, resolved)
        except Exception as exc:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            logger.error("Atomic patch write failed for %s: %s", resolved, exc)
            raise RuntimeError(f"Failed to write patched file: {exc}")

        logger.info(
            "Successfully applied patch to %s (snapshot_id=%s, reason='%s')",
            resolved,
            snapshot.id,
            reason,
        )
        return snapshot

    @classmethod
    def rollback_snapshot(
        cls,
        snapshot_id: str,
        db: Session,
    ) -> dict[str, Any]:
        """Restore file content from a previously recorded snapshot."""
        snapshot = db.execute(
            select(CodeSnapshot).where(CodeSnapshot.id == snapshot_id)
        ).scalar_one_or_none()

        if not snapshot:
            raise ValueError(f"Snapshot '{snapshot_id}' not found")

        resolved = SandboxGuard.validate_path(snapshot.file_path)

        # Restore original content atomically
        parent_dir = os.path.dirname(resolved)
        os.makedirs(parent_dir, exist_ok=True)

        fd, temp_path = tempfile.mkstemp(dir=parent_dir, prefix="jarvis_rollback_")
        try:
            with open(fd, "w", encoding="utf-8", newline="") as temp_fp:
                temp_fp.write(snapshot.original_content)
            os.replace(temp_path, resolved)
        except Exception as exc:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise RuntimeError(f"Failed to rollback file: {exc}")

        snapshot.restored = True
        snapshot.restored_at = utc_now()
        db.commit()

        logger.info("Successfully rolled back snapshot %s for file %s", snapshot_id, resolved)
        return {
            "status": "restored",
            "snapshot_id": snapshot.id,
            "file_path": str(resolved),
            "restored_at": snapshot.restored_at.isoformat() if snapshot.restored_at else None,
        }

    @staticmethod
    def list_snapshots(
        db: Session,
        file_path: str | None = None,
        limit: int = 50,
    ) -> list[CodeSnapshot]:
        """List modification snapshot history."""
        query = select(CodeSnapshot).order_by(CodeSnapshot.created_at.desc())
        if file_path:
            try:
                resolved_path = str(SandboxGuard.validate_path(file_path))
            except Exception:
                resolved_path = file_path
            query = query.where(
                (CodeSnapshot.file_path == resolved_path)
                | (CodeSnapshot.file_path == file_path)
                | (CodeSnapshot.file_path.ilike(file_path))
            )
        query = query.limit(limit)
        return list(db.execute(query).scalars().all())
