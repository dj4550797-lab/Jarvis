"""Tests for Device Diagnostics and Hardware Enumeration.

Complies with PRD Section 12 & 13 and PLAN.md Phase 4.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.devices.detector import DeviceDetector


def test_device_detector_unit_methods() -> None:
    # 1. Audio Inputs
    inputs = DeviceDetector.get_audio_inputs()
    assert isinstance(inputs, list)
    assert len(inputs) >= 1
    assert inputs[0].kind == "audio_input"

    # 2. Audio Outputs
    outputs = DeviceDetector.get_audio_outputs()
    assert isinstance(outputs, list)
    assert len(outputs) >= 1
    assert outputs[0].kind == "audio_output"

    # 3. Displays
    displays = DeviceDetector.get_displays()
    assert isinstance(displays, list)
    assert len(displays) >= 1
    assert displays[0].width > 0
    assert displays[0].height > 0

    # 4. Cameras
    cameras = DeviceDetector.get_cameras()
    assert isinstance(cameras, list)
    assert len(cameras) >= 1

    # 5. Permissions
    permissions = DeviceDetector.get_permissions()
    assert len(permissions) >= 4
    caps = {p.capability for p in permissions}
    assert "microphone" in caps
    assert "camera" in caps
    assert "screen_capture" in caps


def test_get_device_inventory_endpoint(client: TestClient) -> None:
    resp = client.get("/api/v1/devices")
    assert resp.status_code == 200
    data = resp.json()
    assert "audio_inputs" in data
    assert "audio_outputs" in data
    assert "cameras" in data
    assert "displays" in data
    assert "permissions" in data
    assert len(data["audio_inputs"]) >= 1
    assert len(data["displays"]) >= 1


def test_get_audio_and_display_endpoints(client: TestClient) -> None:
    # Audio
    audio_resp = client.get("/api/v1/devices/audio")
    assert audio_resp.status_code == 200
    audio_data = audio_resp.json()
    assert "inputs" in audio_data
    assert "outputs" in audio_data

    # Displays
    disp_resp = client.get("/api/v1/devices/displays")
    assert disp_resp.status_code == 200
    disp_data = disp_resp.json()
    assert len(disp_data) >= 1
    assert disp_data[0]["width"] > 0

    # Permissions
    perm_resp = client.get("/api/v1/devices/permissions")
    assert perm_resp.status_code == 200
    perm_data = perm_resp.json()
    assert any(p["capability"] == "microphone" for p in perm_data)
