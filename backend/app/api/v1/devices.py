"""Device Diagnostics and Hardware Inventory Endpoints.

Implements PRD Section 12 & 13 and PLAN.md Phase 4:
- Hardware enumeration without crashing
- Clear status and error messages
- Permissions and capabilities matrix
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.devices.detector import (
    DeviceDetector,
    DeviceInfo,
    DeviceInventory,
    DisplayInfo,
    PermissionStatus,
)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=DeviceInventory)
def get_device_inventory() -> DeviceInventory:
    """Get complete hardware inventory of inputs, outputs, cameras, and displays."""
    return DeviceDetector.get_inventory()


@router.get("/audio", response_model=dict[str, list[DeviceInfo]])
def get_audio_devices() -> dict[str, list[DeviceInfo]]:
    """List audio recording microphones and playback audio outputs."""
    return {
        "inputs": DeviceDetector.get_audio_inputs(),
        "outputs": DeviceDetector.get_audio_outputs(),
    }


@router.get("/video", response_model=list[DeviceInfo])
def get_video_devices() -> list[DeviceInfo]:
    """List detected cameras and webcams."""
    return DeviceDetector.get_cameras()


@router.get("/displays", response_model=list[DisplayInfo])
def get_displays() -> list[DisplayInfo]:
    """List display screens, resolutions, and monitor counts."""
    return DeviceDetector.get_displays()


@router.get("/permissions", response_model=list[PermissionStatus])
def get_permissions() -> list[PermissionStatus]:
    """Get current permission status for microphone, camera, and screen capture."""
    return DeviceDetector.get_permissions()
