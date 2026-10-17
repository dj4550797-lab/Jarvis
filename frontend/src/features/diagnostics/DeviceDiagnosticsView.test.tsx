import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeviceDiagnosticsView } from "./DeviceDiagnosticsView";

const mockDevices = {
  audio_inputs: [
    {
      id: "in_0",
      name: "Headset M19 Hands-Free",
      kind: "audio_input",
      is_default: true,
      channels: 1,
      sample_rate: 44100,
      status: "available",
      extra: {},
    },
  ],
  audio_outputs: [
    {
      id: "out_0",
      name: "Speakers Realtek HD Audio",
      kind: "audio_output",
      is_default: true,
      channels: 2,
      sample_rate: 48000,
      status: "available",
      extra: {},
    },
  ],
  cameras: [
    {
      id: "cam_0",
      name: "USB HD Webcam",
      kind: "camera",
      is_default: true,
      status: "available",
      extra: {},
    },
  ],
  displays: [
    {
      id: "disp_0",
      name: "Generic PnP Monitor",
      is_primary: true,
      width: 1920,
      height: 1080,
      scaling_percent: 100,
    },
  ],
  permissions: [
    {
      capability: "microphone",
      granted: true,
      status: "granted",
      reason: "Available",
    },
    {
      capability: "audio_output",
      granted: true,
      status: "granted",
      reason: "Available",
    },
    {
      capability: "camera",
      granted: true,
      status: "granted",
      reason: "Available",
    },
    {
      capability: "screen_capture",
      granted: true,
      status: "granted",
      reason: "Available",
    },
  ],
};

const mockVoiceStatus = {
  stt: {
    default_engine: "mock",
    available_engines: ["mock", "webspeech"],
    ready: true,
  },
  tts: {
    default_engine: "mock",
    available_engines: ["mock", "webspeech"],
    ready: true,
  },
};

global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/api/v1/devices")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockDevices),
    });
  }
  if (url.includes("/api/v1/voice/status")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVoiceStatus),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("DeviceDiagnosticsView (Phase 4)", () => {
  it("renders diagnostics header and hardware cards", async () => {
    render(<DeviceDiagnosticsView />);

    await waitFor(() => {
      expect(
        screen.getByText("Device Diagnostics & Hardware Status")
      ).toBeInTheDocument();
    });

    // Check Audio Inputs
    expect(screen.getByText("Headset M19 Hands-Free")).toBeInTheDocument();

    // Check Audio Outputs
    expect(screen.getByText("Speakers Realtek HD Audio")).toBeInTheDocument();

    // Check Displays
    expect(screen.getByText("Generic PnP Monitor")).toBeInTheDocument();
    expect(screen.getByText(/1920 × 1080/)).toBeInTheDocument();

    // Check Cameras
    expect(screen.getByText("USB HD Webcam")).toBeInTheDocument();

    // Check Testing controls
    expect(screen.getByText("Microphone Input Test")).toBeInTheDocument();
    expect(screen.getByText("Test Microphone")).toBeInTheDocument();
    expect(screen.getByText("Test Audio Output")).toBeInTheDocument();
  });

  it("displays permissions matrix with granted badges", async () => {
    render(<DeviceDiagnosticsView />);

    await waitFor(() => {
      expect(
        screen.getByText("Hardware Capabilities & Permissions Matrix")
      ).toBeInTheDocument();
    });

    const grantedBadges = screen.getAllByText("Granted");
    expect(grantedBadges.length).toBeGreaterThanOrEqual(1);
  });
});
