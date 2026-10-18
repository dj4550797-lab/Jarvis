import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ContentView } from "./ContentView";

const mockProjects = [
  {
    id: "proj-001",
    title: "AI Neural Revolution",
    topic: "Transformers and self-attention mechanism",
    target_platform: "youtube_documentary",
    target_duration_seconds: 180,
    status: "in_progress",
    synopsis: "Deep dive into self-attention.",
    outline: "1. Intro\n2. Attention is All You Need\n3. Future",
    raw_script: "### Act 1: Intro\n\nWelcome to neural networks.\n\n### Act 2: Transformers\n\nSelf attention is powerful.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scenes: [
      {
        id: "sc-001",
        project_id: "proj-001",
        scene_number: 1,
        title: "Act 1: Intro",
        narration_text: "Welcome to neural networks.",
        visual_prompt: "Cinematic photograph of neural network glowing connections",
        camera_direction: "Wide aerial establishing shot",
        audio_cues: "Atmospheric synth pad",
        duration_seconds: 10.0,
        asset_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
];

const mockExport = {
  project_id: "proj-001",
  title: "AI Neural Revolution",
  is_valid: true,
  validation_errors: [],
  validation_warnings: [],
  markdown_brief: "# Production Brief: AI Neural Revolution\n\n## Synopsis\nDeep dive into self-attention.",
  storyboard: {
    project_id: "proj-001",
    title: "AI Neural Revolution",
    platform: "youtube_documentary",
    target_duration_seconds: 180,
    estimated_duration_seconds: 10.0,
    total_scenes: 1,
    scenes: mockProjects[0].scenes,
    export_valid: true,
    validation_errors: [],
    validation_warnings: [],
  },
  disclaimer: "External media generation requires verified API credentials.",
};

describe("ContentView Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes("/api/v1/content/projects")) {
        if (opts?.method === "POST" && url.includes("/generate-script")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                project_id: "proj-001",
                outline: "Generated Outline",
                raw_script: "Generated Script Content",
                estimated_words: 100,
                target_words: 200,
                estimated_duration_seconds: 45.0,
              }),
          });
        }
        if (opts?.method === "POST" && url.includes("/breakdown-scenes")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProjects[0].scenes),
          });
        }
        if (opts?.method === "POST" && url.includes("/generate-prompts")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  scene_id: "sc-001",
                  scene_number: 1,
                  prompt: "Cinematic photograph of neural network",
                  negative_prompt: "low quality",
                  aspect_ratio: "16:9",
                  camera_direction: "Wide aerial establishing shot",
                },
              ]),
          });
        }
        if (opts?.method === "POST" && url.includes("/export")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExport),
          });
        }
        if (opts?.method === "POST" && url.includes("/publish")) {
          const body = JSON.parse(opts.body || "{}");
          if (!body.user_confirmed) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  project_id: "proj-001",
                  status: "AUTHORIZATION_REQUIRED",
                  requires_confirmation: true,
                  target_channel: "Default Studio",
                  message: "Explicit user confirmation is required before proceeding.",
                  can_publish: false,
                }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                project_id: "proj-001",
                status: "PUBLISHED_SIMULATED",
                requires_confirmation: false,
                target_channel: "Default Studio",
                message: "Publishing intent authorized by user.",
                can_publish: true,
                verified_url: "local://content/exports/proj-001/package",
              }),
          });
        }
        if (url.match(/\/projects\/[a-zA-Z0-9-]+/)) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects[0]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders Content Production Studio and loads project list", async () => {
    render(<ContentView />);
    expect(screen.getByText("Content Production Studio")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("AI Neural Revolution").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Transformers and self-attention mechanism")).toBeInTheDocument();
    });
  });

  it("navigates between Script, Scenes, Prompts, and Export tabs", async () => {
    render(<ContentView />);

    await waitFor(() => {
      expect(screen.getByText("1. Script & Outline")).toBeInTheDocument();
      expect(screen.getByText(/2. Scene Breakdowns/i)).toBeInTheDocument();
      expect(screen.getByText("3. Visual Prompts")).toBeInTheDocument();
      expect(screen.getByText("4. Export & Publish")).toBeInTheDocument();
    });

    // Click Scenes tab
    fireEvent.click(screen.getByText(/2. Scene Breakdowns/i));
    await waitFor(() => {
      expect(screen.getByText(/Scene 1: Act 1: Intro/i)).toBeInTheDocument();
      expect(screen.getByText(/"Welcome to neural networks."/i)).toBeInTheDocument();
    });

    // Click Visual Prompts tab
    fireEvent.click(screen.getByText("3. Visual Prompts"));
    await waitFor(() => {
      expect(screen.getByText("Generate Visual Prompts")).toBeInTheDocument();
      expect(screen.getByText(/Cinematic photograph of neural network glowing connections/i)).toBeInTheDocument();
    });

    // Click Export tab
    fireEvent.click(screen.getByText("4. Export & Publish"));
    await waitFor(() => {
      expect(screen.getByText("Export Production Package")).toBeInTheDocument();
      expect(screen.getByText(/Publishing Authorization Guardrail/i)).toBeInTheDocument();
    });
  });

  it("executes export package validation", async () => {
    render(<ContentView />);

    await waitFor(() => {
      expect(screen.getByText("4. Export & Publish")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("4. Export & Publish"));

    await waitFor(() => {
      expect(screen.getByText("Export Production Package")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Export Production Package"));

    await waitFor(() => {
      expect(screen.getByText(/✓ Production Package Valid/i)).toBeInTheDocument();
      expect(screen.getByText(/# Production Brief: AI Neural Revolution/i)).toBeInTheDocument();
    });
  });

  it("enforces publishing authorization guardrail requiring user confirmation", async () => {
    render(<ContentView />);

    await waitFor(() => {
      expect(screen.getByText("4. Export & Publish")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("4. Export & Publish"));

    await waitFor(() => {
      expect(screen.getByText("Request Publish Intent")).toBeInTheDocument();
    });

    // Request publish without confirmation checkbox
    fireEvent.click(screen.getByText("Request Publish Intent"));

    await waitFor(() => {
      expect(screen.getByText(/Explicit user confirmation is required before proceeding/i)).toBeInTheDocument();
    });

    // Check confirmation checkbox
    const checkbox = screen.getByLabelText(/I explicitly authorize publication/i);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText("Request Publish Intent"));

    await waitFor(() => {
      expect(screen.getByText(/Publishing intent authorized by user/i)).toBeInTheDocument();
    });
  });
});
