import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  addResearchSource,
  createResearchSession,
  deleteResearchSession,
  deleteResearchSource,
  exportResearchReport,
  getResearchSession,
  listResearchSessions,
} from "../../services/api";
import {
  ResearchReportExport,
  ResearchSession,
} from "../../types";

export const ResearchView: React.FC = () => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state for sources
  const [sourceFilter, setSourceFilter] = useState<"all" | "verified" | "uncertain">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Session Modal
  const [isNewSessionOpen, setIsNewSessionOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newTopic, setNewTopic] = useState<string>("");
  const [newSummary, setNewSummary] = useState<string>("");
  const [creatingSession, setCreatingSession] = useState<boolean>(false);

  // Add Source Modal
  const [isAddSourceOpen, setIsAddSourceOpen] = useState<boolean>(false);
  const [sourceTitle, setSourceTitle] = useState<string>("");
  const [sourceSnippet, setSourceSnippet] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.9);
  const [sourceNotes, setSourceNotes] = useState<string>("");
  const [addingSource, setAddingSource] = useState<boolean>(false);

  // Export Modal
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"markdown" | "json">("markdown");
  const [exportData, setExportData] = useState<ResearchReportExport | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const loadSessions = async (selectId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResearchSessions();
      setSessions(data);
      if (data.length > 0) {
        const targetId = selectId || (activeSession ? activeSession.id : data[0].id);
        const detailed = await getResearchSession(targetId);
        setActiveSession(detailed);
      } else {
        setActiveSession(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load research sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    try {
      const detailed = await getResearchSession(sessionId);
      setActiveSession(detailed);
    } catch (err: any) {
      console.error("Failed to select session:", err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;
    setCreatingSession(true);
    try {
      const created = await createResearchSession({
        title: newTitle.trim(),
        topic: newTopic.trim(),
        summary: newSummary.trim() || undefined,
      });
      setIsNewSessionOpen(false);
      setNewTitle("");
      setNewTopic("");
      setNewSummary("");
      await loadSessions(created.id);
    } catch (err: any) {
      alert(`Error creating session: ${err.message}`);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this research session and all its citations?")) return;
    try {
      await deleteResearchSession(sessionId);
      await loadSessions();
    } catch (err: any) {
      alert(`Error deleting session: ${err.message}`);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !sourceTitle.trim() || !sourceSnippet.trim()) return;
    setAddingSource(true);
    try {
      await addResearchSource(activeSession.id, {
        title: sourceTitle.trim(),
        snippet: sourceSnippet.trim(),
        url: sourceUrl.trim() || undefined,
        is_verified: isVerified,
        confidence,
        notes: sourceNotes.trim() || undefined,
      });
      setIsAddSourceOpen(false);
      setSourceTitle("");
      setSourceSnippet("");
      setSourceUrl("");
      setIsVerified(false);
      setConfidence(0.9);
      setSourceNotes("");
      const updated = await getResearchSession(activeSession.id);
      setActiveSession(updated);
    } catch (err: any) {
      alert(`Error adding evidence source: ${err.message}`);
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!activeSession) return;
    try {
      await deleteResearchSource(sourceId);
      const updated = await getResearchSession(activeSession.id);
      setActiveSession(updated);
    } catch (err: any) {
      alert(`Error deleting source: ${err.message}`);
    }
  };

  const handleOpenExport = async (format: "markdown" | "json" = "markdown") => {
    if (!activeSession) return;
    setExportFormat(format);
    setIsExportOpen(true);
    setExportLoading(true);
    setCopied(false);
    try {
      const data = await exportResearchReport(activeSession.id, format);
      setExportData(data);
    } catch (err: any) {
      alert(`Failed to export report: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!exportData) return;
    const blob = new Blob([exportData.content], {
      type: exportData.format === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(exportData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter sources
  const allSources = activeSession?.sources || [];
  const verifiedCount = allSources.filter((s) => s.is_verified).length;
  const uncertainCount = allSources.filter((s) => !s.is_verified).length;

  const filteredSources = allSources.filter((s) => {
    if (sourceFilter === "verified" && !s.is_verified) return false;
    if (sourceFilter === "uncertain" && s.is_verified) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.snippet.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            Research Assistant
          </h1>
          <p className="text-sm text-gray-400">
            Evidence-based investigation, verifiable citations, Strict Honesty Rule, and formatted report exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession && (
            <button
              onClick={() => handleOpenExport("markdown")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700 transition-all"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              Export Report
            </button>
          )}
          <button
            onClick={() => setIsNewSessionOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            New Research Session
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-1 rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Research Topics</h2>
            <button
              onClick={() => loadSessions()}
              disabled={loading}
              className="p-1 rounded text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  activeSession?.id === sess.id
                    ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                    : "bg-gray-950/60 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-200 truncate">{sess.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                    {sess.status}
                  </span>
                </div>
                <div className="text-[11px] text-indigo-400 truncate">{sess.topic}</div>
              </div>
            ))}
            {sessions.length === 0 && !loading && (
              <p className="text-xs text-gray-500 text-center py-6">No research sessions yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Active Session Details & Evidence Board */}
        <div className="lg:col-span-3 space-y-5">
          {activeSession ? (
            <>
              {/* Session Overview Card */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{activeSession.title}</h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-semibold uppercase">
                        {activeSession.status}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-300 font-mono mt-0.5">Topic: {activeSession.topic}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddSourceOpen(true)}
                      className="flex items-center gap-1 text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Citation / Fact
                    </button>
                    <button
                      onClick={() => handleDeleteSession(activeSession.id)}
                      className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-950/40 transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {activeSession.summary && (
                  <p className="text-xs text-gray-300 bg-gray-950/60 p-3 rounded-lg border border-gray-800/80 leading-relaxed">
                    {activeSession.summary}
                  </p>
                )}

                {/* Strict Honesty Metric Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-400">Total Citations</span>
                      <p className="text-base font-bold text-white">{allSources.length}</p>
                    </div>
                    <Layers className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-400">Verified Empirical Facts</span>
                      <p className="text-base font-bold text-emerald-300">{verifiedCount}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-amber-400">Hypotheses / Uncertain Claims</span>
                      <p className="text-base font-bold text-amber-300">{uncertainCount}</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Strict Honesty Notice Banner */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-3 flex items-start gap-2.5 text-xs text-indigo-200">
                <ShieldCheck className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-indigo-300">Strict Honesty Rule Active:</span> Findings with
                  traceable citations are isolated from speculative hypotheses. Speculative claims are flagged with
                  explicit caveats and requiring empirical replication.
                </div>
              </div>

              {/* Evidence Filter and Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSourceFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sourceFilter === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    All Evidence ({allSources.length})
                  </button>
                  <button
                    onClick={() => setSourceFilter("verified")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sourceFilter === "verified"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    Verified Facts ({verifiedCount})
                  </button>
                  <button
                    onClick={() => setSourceFilter("uncertain")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sourceFilter === "uncertain"
                        ? "bg-amber-600 text-white"
                        : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    Uncertain Claims ({uncertainCount})
                  </button>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter citations..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Citations List */}
              <div className="space-y-3">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-4 rounded-xl border backdrop-blur-md transition-all space-y-2.5 ${
                      source.is_verified
                        ? "bg-gray-900/60 border-emerald-500/20 hover:border-emerald-500/40"
                        : "bg-amber-950/10 border-amber-500/20 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex items-center gap-1 ${
                              source.is_verified
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {source.is_verified ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Verified Fact
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Hypothesis / Uncertain
                              </>
                            )}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            Confidence: {Math.round(source.confidence * 100)}%
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mt-1.5">{source.title}</h3>
                      </div>

                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Citation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <blockquote className="text-xs text-gray-300 italic border-l-2 border-indigo-500 pl-3 py-1 bg-black/20 rounded-r">
                      &quot;{source.snippet}&quot;
                    </blockquote>

                    {source.notes && (
                      <div className="text-xs text-gray-400 pt-1">
                        <span className="font-semibold text-gray-300">Notes / Caveats:</span> {source.notes}
                      </div>
                    )}

                    {source.url && (
                      <div className="pt-1 flex items-center gap-1.5 text-xs text-indigo-400">
                        <ExternalLink className="h-3 w-3" />
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline truncate max-w-md font-mono"
                        >
                          {source.url}
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {filteredSources.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-gray-800 bg-gray-900/40 text-gray-500 text-xs">
                    No research citations match your filter criteria.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-xl border border-gray-800 bg-gray-900/40 text-gray-400 space-y-3">
              <BookOpen className="h-10 w-10 text-gray-600 mx-auto" />
              <h3 className="text-base font-semibold text-gray-300">No Research Session Selected</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Select an existing research investigation from the left sidebar or create a new session to organize
                evidence and citations.
              </p>
              <button
                onClick={() => setIsNewSessionOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Session */}
      {isNewSessionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                New Research Session
              </h3>
              <button onClick={() => setIsNewSessionOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Memory Optimization Techniques in Python"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Topic / Domain</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Backend Performance, AI, Distributed Systems"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Executive Summary / Scope</label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={3}
                  placeholder="Brief summary of research scope and objectives..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionOpen(false)}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creatingSession ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Evidence Source */}
      {isAddSourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Add Documented Citation or Evidence
              </h3>
              <button onClick={() => setIsAddSourceOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Evidence Title</label>
                <input
                  type="text"
                  required
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="e.g. Official Documentation or Benchmark Results"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Direct Excerpt / Evidence Snippet</label>
                <textarea
                  required
                  value={sourceSnippet}
                  onChange={(e) => setSourceSnippet(e.target.value)}
                  rows={3}
                  placeholder="Direct factual claim or quoted snippet..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Verifiable URL / Citation Link</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Strict Honesty Toggle */}
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-semibold text-gray-200">
                    Empirically Verified Fact (Strict Honesty Rule)
                  </span>
                </label>
                <p className="text-[11px] text-gray-400 pl-5">
                  Check only if confirmed by primary sources, official documentation, or reproducible benchmarks. Leave
                  unchecked for hypotheses and tentative findings.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-300 font-medium">Confidence Rating</label>
                  <span className="text-indigo-400 font-mono">{Math.round(confidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Methodology Notes / Caveats</label>
                <input
                  type="text"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder="Analytical remarks, caveats, or gaps..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSourceOpen(false)}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSource}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {addingSource ? "Adding..." : "Add Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Export Report Preview */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-400" />
                  Export Research Report
                </h3>
                <div className="flex rounded-lg border border-gray-800 bg-gray-950 p-0.5 text-xs">
                  <button
                    onClick={() => handleOpenExport("markdown")}
                    className={`px-2.5 py-1 rounded font-medium ${
                      exportFormat === "markdown" ? "bg-indigo-600 text-white" : "text-gray-400"
                    }`}
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => handleOpenExport("json")}
                    className={`px-2.5 py-1 rounded font-medium ${
                      exportFormat === "json" ? "bg-indigo-600 text-white" : "text-gray-400"
                    }`}
                  >
                    JSON (.json)
                  </button>
                </div>
              </div>
              <button onClick={() => setIsExportOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-xs text-gray-300">
              {exportLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Generating report...
                </div>
              ) : exportData ? (
                <pre className="whitespace-pre-wrap">{exportData.content}</pre>
              ) : (
                <p className="text-gray-500 italic">No report content available.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
              <span className="text-gray-400 font-mono">{exportData?.filename}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyReport}
                  disabled={!exportData}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-200 hover:bg-gray-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!exportData}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-medium text-white hover:bg-indigo-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
