"""Tests for Content Production Engine (Phase 8).

Validates:
- Project creation, retrieval, updates, and deletion
- Structured script drafting with acts and pacing
- Scene breakdown with camera directions and speaking rate duration
- Visual diffusion prompt generation with aspect ratios and negative prompts
- Export package validation and production brief generation
- Explicit publishing authorization guardrails
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.content.service import get_content_service


@pytest.fixture
def content_service():
    return get_content_service()


def test_content_service_project_lifecycle(content_service, db_session: Session):
    # 1. Create project
    proj = content_service.create_project(
        title="AI Revolution Documentary",
        topic="The history and future of artificial neural networks",
        target_platform="youtube_documentary",
        target_duration_seconds=300,
        synopsis="A deep look into deep learning architectures from perceptrons to transformers.",
        db=db_session,
    )
    assert proj.id is not None
    assert proj.title == "AI Revolution Documentary"
    assert proj.target_platform == "youtube_documentary"
    assert proj.status == "draft"

    # 2. Get project
    fetched = content_service.get_project(proj.id, db=db_session)
    assert fetched is not None
    assert fetched.id == proj.id
    assert fetched.topic == "The history and future of artificial neural networks"

    # 3. List projects
    projs = content_service.list_projects(limit=10, db=db_session)
    assert any(p.id == proj.id for p in projs)

    # 4. Update project
    updated = content_service.update_project(
        project_id=proj.id,
        title="AI Revolution: From Perceptrons to LLMs",
        status="in_progress",
        db=db_session,
    )
    assert updated is not None
    assert updated.title == "AI Revolution: From Perceptrons to LLMs"
    assert updated.status == "in_progress"

    # 5. Delete project
    deleted = content_service.delete_project(proj.id, db=db_session)
    assert deleted is True
    assert content_service.get_project(proj.id, db=db_session) is None


def test_script_generation_and_scene_breakdown(content_service, db_session: Session):
    proj = content_service.create_project(
        title="Quantum Computing Demystified",
        topic="Quantum superposition and qubits",
        target_platform="youtube_documentary",
        target_duration_seconds=120,
        db=db_session,
    )

    # Generate script
    script_res = content_service.generate_script_draft(
        project_id=proj.id,
        tone="enthusiastic and precise",
        key_points=[
            "Introduction to quantum phenomena",
            "Superposition vs classical bits",
            "Real-world cryptography implications",
            "Conclusion",
        ],
        db=db_session,
    )
    assert script_res["project_id"] == proj.id
    assert "Act 1:" in script_res["raw_script"]
    assert script_res["estimated_duration_seconds"] > 0

    # Break down scenes
    scenes = content_service.breakdown_scenes(proj.id, replace_existing=True, db=db_session)
    assert len(scenes) >= 4
    for idx, s in enumerate(scenes, 1):
        assert s.scene_number == idx
        assert len(s.narration_text) > 0
        assert s.duration_seconds >= 5.0
        assert s.camera_direction is not None
        assert s.audio_cues is not None

    # Generate visual prompts
    prompts = content_service.generate_visual_prompts(
        project_id=proj.id,
        style="cinematic sci-fi photorealism",
        aspect_ratio="16:9",
        db=db_session,
    )
    assert len(prompts) == len(scenes)
    for p in prompts:
        assert "cinematic sci-fi photorealism" in p["prompt"]
        assert p["aspect_ratio"] == "16:9"
        assert len(p["negative_prompt"]) > 0

    # Export production package
    export_pkg = content_service.export_production_package(proj.id, db=db_session)
    assert export_pkg["is_valid"] is True
    assert "Production Brief: Quantum Computing Demystified" in export_pkg["markdown_brief"]
    assert "Scene Storyboard & Audio Cues" in export_pkg["markdown_brief"]
    assert export_pkg["storyboard"]["total_scenes"] == len(scenes)

    # Cleanup
    content_service.delete_project(proj.id, db=db_session)


def test_publishing_authorization_guardrail(content_service, db_session: Session):
    proj = content_service.create_project(
        title="Autonomous Drones in Logistics",
        topic="Drone delivery economics",
        db=db_session,
    )

    # Without user confirmation -> must require authorization
    unauthorized = content_service.request_publishing_intent(
        project_id=proj.id,
        user_confirmed=False,
        target_channel="TechExplorers",
        db=db_session,
    )
    assert unauthorized["status"] == "AUTHORIZATION_REQUIRED"
    assert unauthorized["can_publish"] is False
    assert unauthorized["requires_confirmation"] is True

    # With explicit user confirmation -> authorization approved
    authorized = content_service.request_publishing_intent(
        project_id=proj.id,
        user_confirmed=True,
        target_channel="TechExplorers",
        db=db_session,
    )
    assert authorized["status"] == "PUBLISHED_SIMULATED"
    assert authorized["can_publish"] is True
    assert "local://content/exports" in authorized["verified_url"]

    # Verify project status in DB
    refreshed = content_service.get_project(proj.id, db=db_session)
    assert refreshed.status == "published"

    content_service.delete_project(proj.id, db=db_session)


def test_content_api_endpoints(client: TestClient):
    # 1. Create via API
    res = client.post("/api/v1/content/projects", json={
        "title": "API Test Project",
        "topic": "Microservices vs Monoliths",
        "target_platform": "short_form",
        "target_duration_seconds": 60,
        "synopsis": "Comparing architectural paradigms.",
    })
    assert res.status_code == 201
    data = res.json()
    proj_id = data["id"]
    assert data["title"] == "API Test Project"

    # 2. List projects
    res_list = client.get("/api/v1/content/projects")
    assert res_list.status_code == 200
    assert any(p["id"] == proj_id for p in res_list.json())

    # 3. Generate script
    res_script = client.post(f"/api/v1/content/projects/{proj_id}/generate-script", json={
        "tone": "fast-paced",
    })
    assert res_script.status_code == 200
    assert "raw_script" in res_script.json()

    # 4. Breakdown scenes
    res_scenes = client.post(f"/api/v1/content/projects/{proj_id}/breakdown-scenes", json={
        "replace_existing": True,
    })
    assert res_scenes.status_code == 200
    assert len(res_scenes.json()) > 0

    # 5. Generate prompts
    res_prompts = client.post(f"/api/v1/content/projects/{proj_id}/generate-prompts", json={
        "style": "minimalist flat design",
        "aspect_ratio": "9:16",
    })
    assert res_prompts.status_code == 200
    assert len(res_prompts.json()) > 0

    # 6. Export package
    res_export = client.post(f"/api/v1/content/projects/{proj_id}/export")
    assert res_export.status_code == 200
    assert "markdown_brief" in res_export.json()

    # 7. Publish authorization test
    res_pub_block = client.post(f"/api/v1/content/projects/{proj_id}/publish", json={
        "user_confirmed": False,
    })
    assert res_pub_block.status_code == 200
    assert res_pub_block.json()["can_publish"] is False

    res_pub_ok = client.post(f"/api/v1/content/projects/{proj_id}/publish", json={
        "user_confirmed": True,
    })
    assert res_pub_ok.status_code == 200
    assert res_pub_ok.json()["can_publish"] is True

    # 8. Delete project
    res_del = client.delete(f"/api/v1/content/projects/{proj_id}")
    assert res_del.status_code == 200
