"""API v1 Router."""

from fastapi import APIRouter

from app.api.v1.chat import router as chat_router
from app.api.v1.coding import router as coding_router
from app.api.v1.devices import router as devices_router
from app.api.v1.health import router as health_router
from app.api.v1.memory import router as memory_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.research import router as research_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.tools import router as tools_router
from app.api.v1.voice import router as voice_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health_router)
v1_router.include_router(chat_router)
v1_router.include_router(memory_router)
v1_router.include_router(devices_router)
v1_router.include_router(voice_router)
v1_router.include_router(tools_router)
v1_router.include_router(tasks_router)
v1_router.include_router(notifications_router)
v1_router.include_router(coding_router)
v1_router.include_router(research_router)

__all__ = ["v1_router"]


