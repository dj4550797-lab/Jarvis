"""Content Production and Multi-Agent ORM Models.

Complies with Phase 8 requirements, PRD Sections 18 & 20, and SECURITY.md:
- Content projects tracking script drafts, outlines, and scene breakdowns
- Scene breakdown with camera directions, visual prompts, audio cues, and pacing
- Agent workflow runs with traceable step-by-step logs, loop prevention, and cancellation
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ContentProject(Base):
    """Content project tracking production from topic research to script & scenes."""

    __tablename__ = "content_projects"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    topic: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    target_platform: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="youtube_documentary",
    )
    target_duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=180,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="draft",  # draft, in_progress, completed, published
    )
    synopsis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    outline: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    raw_script: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    scenes: Mapped[list[SceneBreakdown]] = relationship(
        "SceneBreakdown",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="SceneBreakdown.scene_number",
    )

    def to_dict(self, include_scenes: bool = True) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "topic": self.topic,
            "target_platform": self.target_platform,
            "target_duration_seconds": self.target_duration_seconds,
            "status": self.status,
            "synopsis": self.synopsis or "",
            "outline": self.outline or "",
            "raw_script": self.raw_script or "",
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else "",
        }
        if include_scenes:
            data["scenes"] = [s.to_dict() for s in (self.scenes or [])]
        return data


class SceneBreakdown(Base):
    """Detailed scene item with narration, visual prompts, and audio cues."""

    __tablename__ = "scene_breakdowns"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    project_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("content_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scene_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    narration_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    visual_prompt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    camera_direction: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        default="Wide establishing shot, smooth push-in",
    )
    audio_cues: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default="Ambient score, low drone",
    )
    duration_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=10.0,
    )
    asset_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",  # pending, ready, simulated
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    project: Mapped[ContentProject] = relationship(
        "ContentProject",
        back_populates="scenes",
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "scene_number": self.scene_number,
            "title": self.title,
            "narration_text": self.narration_text,
            "visual_prompt": self.visual_prompt or "",
            "camera_direction": self.camera_direction or "",
            "audio_cues": self.audio_cues or "",
            "duration_seconds": self.duration_seconds,
            "asset_status": self.asset_status,
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else "",
        }


class AgentWorkflowRun(Base):
    """Tracks a multi-agent orchestrated run with structured, traceable logs and hard turn limits."""

    __tablename__ = "agent_workflow_runs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    goal: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    agent_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="multi_orchestrated",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="queued",  # queued, running, completed, failed, cancelled
    )
    current_step: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    max_steps: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,  # Strict anti-loop maximum limit
    )
    input_payload_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    output_payload_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    trace_log_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    @property
    def input_payload(self) -> dict[str, Any]:
        if not self.input_payload_json:
            return {}
        try:
            return json.loads(self.input_payload_json)
        except Exception:
            return {}

    @input_payload.setter
    def input_payload(self, val: dict[str, Any]) -> None:
        self.input_payload_json = json.dumps(val)

    @property
    def output_payload(self) -> dict[str, Any]:
        if not self.output_payload_json:
            return {}
        try:
            return json.loads(self.output_payload_json)
        except Exception:
            return {}

    @output_payload.setter
    def output_payload(self, val: dict[str, Any]) -> None:
        self.output_payload_json = json.dumps(val)

    @property
    def trace_log(self) -> list[dict[str, Any]]:
        if not self.trace_log_json:
            return []
        try:
            return json.loads(self.trace_log_json)
        except Exception:
            return []

    @trace_log.setter
    def trace_log(self, val: list[dict[str, Any]]) -> None:
        self.trace_log_json = json.dumps(val)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "goal": self.goal,
            "agent_type": self.agent_type,
            "status": self.status,
            "current_step": self.current_step,
            "max_steps": self.max_steps,
            "input_payload": self.input_payload,
            "output_payload": self.output_payload,
            "trace_log": self.trace_log,
            "error_message": self.error_message or "",
            "created_at": self.created_at.isoformat() if self.created_at else "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else "",
        }
