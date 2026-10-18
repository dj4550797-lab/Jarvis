"""Content Production API Endpoints.

Complies with Phase 8 & PRD Section 18:
- Project management and script drafts
- Scene breakdown with audio cue integration
- Visual diffusion prompt generation
- Validated production package export
- Explicit publishing authorization guardrails
"""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.content.service import ContentService, get_content_service
from app.database import get_db
from app.utils.logging import logger

router = APIRouter(prefix="/content", tags=["Content Production"])


# --- Pydantic Schemas ---

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    topic: str = Field(..., min_length=1, max_length=512)
    target_platform: str = Field(default="youtube_documentary", max_length=64)
    target_duration_seconds: int = Field(default=180, ge=10, le=7200)
    synopsis: str = Field(default="", max_length=2000)


class UpdateProjectRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    topic: str | None = Field(default=None, max_length=512)
    target_platform: str | None = Field(default=None, max_length=64)
    target_duration_seconds: int | None = Field(default=None, ge=10, le=7200)
    status: str | None = Field(default=None, max_length=32)
    synopsis: str | None = None
    outline: str | None = None
    raw_script: str | None = None


class GenerateScriptRequest(BaseModel):
    tone: str = Field(default="engaging and informative", max_length=128)
    key_points: list[str] | None = None


class BreakdownScenesRequest(BaseModel):
    replace_existing: bool = True


class GeneratePromptsRequest(BaseModel):
    style: str = Field(default="photorealistic cinematic", max_length=128)
    aspect_ratio: str = Field(default="16:9", max_length=16)


class PublishRequest(BaseModel):
    user_confirmed: bool = Field(default=False)
    target_channel: str = Field(default="default_channel", max_length=128)


# --- Endpoints ---

@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    req: CreateProjectRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Create a new content production project."""
    try:
        project = service.create_project(
            title=req.title,
            topic=req.topic,
            target_platform=req.target_platform,
            target_duration_seconds=req.target_duration_seconds,
            synopsis=req.synopsis,
            db=db,
        )
        return project.to_dict()
    except Exception as exc:
        logger.error("Failed to create content project: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/projects")
def list_projects(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> list[dict[str, Any]]:
    """List recent content projects."""
    projects = service.list_projects(limit=limit, db=db)
    return [p.to_dict(include_scenes=False) for p in projects]


@router.get("/projects/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Get project details including all scene breakdowns."""
    project = service.get_project(project_id, db=db)
    if not project:
        raise HTTPException(status_code=404, detail="Content project not found.")
    return project.to_dict(include_scenes=True)


@router.patch("/projects/{project_id}")
def update_project(
    project_id: str,
    req: UpdateProjectRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Update project metadata or script."""
    project = service.update_project(
        project_id=project_id,
        title=req.title,
        topic=req.topic,
        target_platform=req.target_platform,
        target_duration_seconds=req.target_duration_seconds,
        status=req.status,
        synopsis=req.synopsis,
        outline=req.outline,
        raw_script=req.raw_script,
        db=db,
    )
    if not project:
        raise HTTPException(status_code=404, detail="Content project not found.")
    return project.to_dict(include_scenes=True)


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Delete a content project and all associated scenes."""
    success = service.delete_project(project_id, db=db)
    if not success:
        raise HTTPException(status_code=404, detail="Content project not found.")
    return {"message": "Content project deleted successfully."}


@router.post("/projects/{project_id}/generate-script")
def generate_script(
    project_id: str,
    req: GenerateScriptRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Generate a structured script draft for the project."""
    try:
        return service.generate_script_draft(
            project_id=project_id,
            tone=req.tone,
            key_points=req.key_points,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to generate script draft: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/projects/{project_id}/breakdown-scenes")
def breakdown_scenes(
    project_id: str,
    req: BreakdownScenesRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> list[dict[str, Any]]:
    """Break down the script into sequential scene items."""
    try:
        scenes = service.breakdown_scenes(
            project_id=project_id,
            replace_existing=req.replace_existing,
            db=db,
        )
        return [s.to_dict() for s in scenes]
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to break down scenes: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/projects/{project_id}/generate-prompts")
def generate_prompts(
    project_id: str,
    req: GeneratePromptsRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> list[dict[str, Any]]:
    """Generate high-fidelity visual prompts for all scenes."""
    try:
        return service.generate_visual_prompts(
            project_id=project_id,
            style=req.style,
            aspect_ratio=req.aspect_ratio,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to generate visual prompts: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/projects/{project_id}/export")
def export_package(
    project_id: str,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Validate and export production brief and storyboard JSON."""
    try:
        return service.export_production_package(project_id, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to export production package: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/projects/{project_id}/publish")
def publish_content(
    project_id: str,
    req: PublishRequest,
    db: Session = Depends(get_db),
    service: ContentService = Depends(get_content_service),
) -> dict[str, Any]:
    """Request publishing authorization with explicit user confirmation."""
    try:
        return service.request_publishing_intent(
            project_id=project_id,
            user_confirmed=req.user_confirmed,
            target_channel=req.target_channel,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Failed publishing request: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
