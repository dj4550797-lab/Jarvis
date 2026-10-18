import React, { useEffect, useState } from "react";
import {
  breakdownScenes,
  createContentProject,
  deleteContentProject,
  exportContentPackage,
  generateScriptDraft,
  generateVisualPrompts,
  getContentProject,
  listContentProjects,
  publishContentProject,
  updateContentProject,
} from "../../services/api";
import { ContentExportPackage, ContentProject } from "../../types";

export const ContentView: React.FC = () => {
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<ContentProject | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "scenes" | "prompts" | "export">("script");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New Project Form Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newPlatform, setNewPlatform] = useState("youtube_documentary");
  const [newDuration, setNewDuration] = useState(180);
  const [newSynopsis, setNewSynopsis] = useState("");

  // Script Generator Options
  const [scriptTone, setScriptTone] = useState("engaging and informative");

  // Prompt Generator Options
  const [promptStyle, setPromptStyle] = useState("cinematic photorealism");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  // Export & Publish State
  const [exportPackage, setExportPackage] = useState<ContentExportPackage | null>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [targetChannel, setTargetChannel] = useState("Default Studio");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listContentProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load content projects.");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const proj = await getContentProject(id);
      setCurrentProject(proj);
      setExportPackage(null);
      setPublishStatus(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const created = await createContentProject({
        title: newTitle,
        topic: newTopic,
        target_platform: newPlatform,
        target_duration_seconds: Number(newDuration),
        synopsis: newSynopsis,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewTopic("");
      setNewSynopsis("");
      await loadProjects();
      setSelectedProjectId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this content project and all scenes?")) return;
    try {
      await deleteContentProject(id);
      setSelectedProjectId(null);
      setCurrentProject(null);
      await loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to delete project.");
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      await generateScriptDraft(selectedProjectId, scriptTone);
      await loadProjectDetails(selectedProjectId);
    } catch (err: any) {
      setError(err.message || "Failed to generate script draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdownScenes = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      await breakdownScenes(selectedProjectId, true);
      await loadProjectDetails(selectedProjectId);
    } catch (err: any) {
      setError(err.message || "Failed to break down scenes.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      await generateVisualPrompts(selectedProjectId, promptStyle, aspectRatio);
      await loadProjectDetails(selectedProjectId);
    } catch (err: any) {
      setError(err.message || "Failed to generate visual prompts.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPackage = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const pkg = await exportContentPackage(selectedProjectId);
      setExportPackage(pkg);
    } catch (err: any) {
      setError(err.message || "Failed to export package.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await publishContentProject(selectedProjectId, publishConfirm, targetChannel);
      setPublishStatus(res.message);
      if (res.can_publish) {
        await loadProjectDetails(selectedProjectId);
      }
    } catch (err: any) {
      setError(err.message || "Publishing operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 p-6 overflow-y-auto" id="content-view-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Content Production Studio
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automate video scripts, scene breakdowns, diffusion prompts, audio cues, and export verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="new-project-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-950/40 border border-cyan-400/30"
          >
            <span>+</span> New Project
          </button>
        </div>
      </div>

      {error && (
        <div id="content-error-banner" className="my-4 p-4 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 flex-1 min-h-0">
        {/* Left Column: Project Selector */}
        <div className="lg:col-span-1 flex flex-col rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
            Production Projects ({projects.length})
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="projects-list">
            {projects.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No projects found. Click "+ New Project" to begin.
              </div>
            ) : (
              projects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border text-left ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/30"
                        : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-200 text-sm truncate">{p.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {p.target_platform.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{p.topic}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-500">
                      <span>{p.target_duration_seconds}s target</span>
                      <span className={`capitalize font-semibold ${p.status === "published" ? "text-emerald-400" : "text-amber-400"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Project Workspace */}
        <div className="lg:col-span-3 flex flex-col rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-xl backdrop-blur-md">
          {!currentProject ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select or create a project to inspect and generate assets.
            </div>
          ) : (
            <>
              {/* Project Title Bar */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                    {currentProject.title}
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                      {currentProject.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{currentProject.topic}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteProject(currentProject.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/30 border border-rose-800/50 rounded-lg hover:bg-rose-900/40 transition-colors"
                  >
                    Delete Project
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 mt-4 gap-2">
                {[
                  { id: "script", label: "1. Script & Outline" },
                  { id: "scenes", label: `2. Scene Breakdowns (${currentProject.scenes?.length || 0})` },
                  { id: "prompts", label: "3. Visual Prompts" },
                  { id: "export", label: "4. Export & Publish" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-cyan-400 text-cyan-300 bg-slate-800/50"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 mt-4 overflow-y-auto">
                {/* 1. SCRIPT TAB */}
                {activeTab === "script" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-400">Tone:</label>
                        <select
                          value={scriptTone}
                          onChange={(e) => setScriptTone(e.target.value)}
                          className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700"
                        >
                          <option value="engaging and informative">Engaging and Informative</option>
                          <option value="dramatic and cinematic">Dramatic and Cinematic</option>
                          <option value="concise and punchy">Concise and Punchy</option>
                          <option value="academic and rigorous">Academic and Rigorous</option>
                        </select>
                      </div>

                      <button
                        id="generate-script-btn"
                        onClick={handleGenerateScript}
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-all shadow disabled:opacity-50"
                      >
                        {loading ? "Generating Draft..." : "Generate Script Draft"}
                      </button>
                    </div>

                    {currentProject.outline && (
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Outline</h3>
                        <pre className="text-xs text-cyan-300 whitespace-pre-wrap font-sans">{currentProject.outline}</pre>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Narration Script</h3>
                      <textarea
                        rows={12}
                        value={currentProject.raw_script || ""}
                        onChange={(e) => setCurrentProject({ ...currentProject, raw_script: e.target.value })}
                        onBlur={() => updateContentProject(currentProject.id, { raw_script: currentProject.raw_script })}
                        placeholder="Script narration draft will appear here..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. SCENES TAB */}
                {activeTab === "scenes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <p className="text-xs text-slate-400">
                        Convert narrative script into sequential scenes with camera angles and speaking rate pacing (~140 wpm).
                      </p>
                      <button
                        id="breakdown-scenes-btn"
                        onClick={handleBreakdownScenes}
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-all shadow disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Generate Scene Breakdown"}
                      </button>
                    </div>

                    <div className="space-y-3" id="scenes-list">
                      {(!currentProject.scenes || currentProject.scenes.length === 0) ? (
                        <div className="text-center py-10 text-slate-500 text-sm">
                          No scenes generated yet. Click "Generate Scene Breakdown" to parse the script.
                        </div>
                      ) : (
                        currentProject.scenes.map((s) => (
                          <div key={s.id} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-cyan-300">
                                Scene {s.scene_number}: {s.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                                  {s.duration_seconds}s
                                </span>
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {s.asset_status}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2.5 rounded border border-slate-800/50">
                              "{s.narration_text}"
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                              <div>
                                <span className="text-slate-500 font-semibold">Camera: </span>
                                {s.camera_direction}
                              </div>
                              <div>
                                <span className="text-slate-500 font-semibold">Audio: </span>
                                {s.audio_cues}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. VISUAL PROMPTS TAB */}
                {activeTab === "prompts" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800 gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400">Style:</label>
                          <select
                            value={promptStyle}
                            onChange={(e) => setPromptStyle(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700"
                          >
                            <option value="cinematic photorealism">Cinematic Photorealism</option>
                            <option value="documentary 35mm film">Documentary 35mm Film</option>
                            <option value="sci-fi volumetric concept art">Sci-Fi Volumetric Concept</option>
                            <option value="minimalist vector infographic">Minimalist Vector Infographic</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400">Aspect Ratio:</label>
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700"
                          >
                            <option value="16:9">16:9 (YouTube/Landscape)</option>
                            <option value="9:16">9:16 (Shorts/Reels)</option>
                            <option value="1:1">1:1 (Square)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        id="generate-prompts-btn"
                        onClick={handleGeneratePrompts}
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-500 transition-all shadow disabled:opacity-50"
                      >
                        {loading ? "Generating..." : "Generate Visual Prompts"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(!currentProject.scenes || currentProject.scenes.length === 0) ? (
                        <div className="text-center py-10 text-slate-500 text-sm">
                          Please generate scene breakdowns first before creating visual prompts.
                        </div>
                      ) : (
                        currentProject.scenes.map((s) => (
                          <div key={s.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-teal-300">
                                Scene {s.scene_number}: {s.title}
                              </span>
                              <button
                                onClick={() => navigator.clipboard.writeText(s.visual_prompt || "")}
                                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                              >
                                Copy Prompt
                              </button>
                            </div>
                            <div className="text-xs font-mono text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800/80 break-words">
                              {s.visual_prompt || "No visual prompt generated yet."}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. EXPORT & PUBLISH TAB */}
                {activeTab === "export" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">Validation & Production Brief</h3>
                        <p className="text-[11px] text-slate-400">
                          Verify narration, timing, and prompts before export.
                        </p>
                      </div>

                      <button
                        id="export-package-btn"
                        onClick={handleExportPackage}
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-all shadow disabled:opacity-50"
                      >
                        {loading ? "Validating..." : "Export Production Package"}
                      </button>
                    </div>

                    {exportPackage && (
                      <div className="space-y-4" id="export-package-results">
                        <div className={`p-3 rounded-lg border text-xs ${
                          exportPackage.is_valid
                            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                            : "bg-rose-950/40 border-rose-500/50 text-rose-200"
                        }`}>
                          <div className="font-semibold">
                            {exportPackage.is_valid ? "✓ Production Package Valid" : "⚠ Validation Issues Found"}
                          </div>
                          {exportPackage.validation_warnings.length > 0 && (
                            <ul className="mt-2 list-disc list-inside space-y-1 text-amber-300">
                              {exportPackage.validation_warnings.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
                          <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                            Markdown Production Brief
                          </h4>
                          <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans">
                            {exportPackage.markdown_brief}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Publishing Authorization Guardrail Section */}
                    <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-800/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">🛡</span>
                        <h4 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                          Publishing Authorization Guardrail (PRD Section 18.4)
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Uploading or publishing content is an external side effect. JARVIS never makes unverified external API claims or automated cloud deployments without user confirmation.
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-indigo-900/40">
                        <input
                          type="text"
                          value={targetChannel}
                          onChange={(e) => setTargetChannel(e.target.value)}
                          placeholder="Target platform / channel"
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded"
                        />

                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={publishConfirm}
                            onChange={(e) => setPublishConfirm(e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                          />
                          I explicitly authorize publication
                        </label>

                        <button
                          id="publish-btn"
                          onClick={handlePublish}
                          disabled={loading}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-all shadow disabled:opacity-50"
                        >
                          Request Publish Intent
                        </button>
                      </div>

                      {publishStatus && (
                        <div id="publish-status-banner" className="text-xs p-2.5 rounded bg-slate-900 border border-indigo-500/40 text-cyan-300">
                          {publishStatus}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Create New Content Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The Architecture of Neural Networks"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Topic / Subject</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Deep learning transformer models and self-attention"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="youtube_documentary">YouTube Documentary</option>
                    <option value="short_form">Short-Form Reel / TikTok</option>
                    <option value="educational_explainer">Educational Explainer</option>
                    <option value="podcast_audio">Podcast Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Duration (s)</label>
                  <input
                    type="number"
                    min={30}
                    max={7200}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Synopsis (Optional)</label>
                <textarea
                  rows={3}
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="Brief summary of the creative vision..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 rounded hover:bg-cyan-500 shadow"
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ContentView;
