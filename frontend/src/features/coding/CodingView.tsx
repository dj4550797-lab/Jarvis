import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Code,
  FileCode,
  FileSearch,
  FileText,
  History,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  applyCodePatch,
  diagnoseStackTrace,
  generateCodeDiff,
  inspectProjectDirectory,
  listCodeSnapshots,
  rollbackCodeSnapshot,
  runControlledTest,
  searchProjectCode,
  validatePythonSyntax,
} from "../../services/api";
import {
  CodeSearchResult,
  CodeSnapshot,
  DiffResult,
  ProjectInspectionResult,
  StackTraceDiagnosticResult,
  SyntaxValidationResult,
  TestRunResult,
} from "../../types";

type CodingTab = "inspector" | "diagnostics" | "patcher" | "testrunner";

export const CodingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CodingTab>("inspector");

  // Inspector & Search State
  const [inspectPath, setInspectPath] = useState<string>("f:\\Jarvis");
  const [maxFiles, setMaxFiles] = useState<number>(150);
  const [inspectResult, setInspectResult] = useState<ProjectInspectionResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRegex, setIsRegex] = useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<CodeSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Diagnostics State
  const [diagSubTab, setDiagSubTab] = useState<"syntax" | "trace">("syntax");
  const [pythonCode, setPythonCode] = useState<string>(
    "def calculate_metrics(items: list[int]) -> dict:\n    total = sum(items)\n    count = len(items)\n    return {'total': total, 'average': total / count if count > 0 else 0}\n"
  );
  const [syntaxResult, setSyntaxResult] = useState<SyntaxValidationResult | null>(null);
  const [syntaxLoading, setSyntaxLoading] = useState<boolean>(false);

  const [rawTrace, setRawTrace] = useState<string>(
    'Traceback (most recent call last):\n  File "f:\\Jarvis\\backend\\app\\coding\\inspector.py", line 61, in inspect_directory\n    resolved = SandboxGuard.validate_path(directory_path)\n  File "f:\\Jarvis\\backend\\app\\tools\\security.py", line 125, in validate_path\n    raise SecurityViolationError("Path traversal denied")\nSecurityViolationError: Path traversal denied\n'
  );
  const [traceResult, setTraceResult] = useState<StackTraceDiagnosticResult | null>(null);
  const [traceLoading, setTraceLoading] = useState<boolean>(false);

  // Diff & Patcher State
  const [patchFilePath, setPatchFilePath] = useState<string>("f:\\Jarvis\\backend\\app\\test_sample.py");
  const [patchReason, setPatchReason] = useState<string>("Add error handling and telemetry");
  const [origContent, setOrigContent] = useState<string>("def process(data):\n    return data.strip()\n");
  const [newContent, setNewContent] = useState<string>(
    "def process(data):\n    if not data:\n        return ''\n    return data.strip()\n"
  );
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState<boolean>(false);
  const [patchLoading, setPatchLoading] = useState<boolean>(false);
  const [patchStatusMessage, setPatchStatusMessage] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState<boolean>(false);

  // Test Runner State
  const [testTarget, setTestTarget] = useState<"backend" | "frontend">("backend");
  const [testSubpath, setTestSubpath] = useState<string>("tests/test_coding.py");
  const [testTimeout, setTestTimeout] = useState<number>(120);
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [testRunning, setTestRunning] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Load initial snapshots
  const loadSnapshots = async () => {
    setSnapshotsLoading(true);
    try {
      const data = await listCodeSnapshots(undefined, 20);
      setSnapshots(data);
    } catch (err: any) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "patcher") {
      loadSnapshots();
    }
  }, [activeTab]);

  // Handlers
  const handleInspect = async () => {
    setInspectLoading(true);
    setInspectError(null);
    try {
      const data = await inspectProjectDirectory(inspectPath, maxFiles);
      setInspectResult(data);
    } catch (err: any) {
      setInspectError(err.message || "Failed to inspect directory");
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await searchProjectCode(searchQuery, inspectPath, isRegex, caseSensitive, 50);
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message || "Failed to search source code");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleValidateSyntax = async () => {
    setSyntaxLoading(true);
    try {
      const data = await validatePythonSyntax(pythonCode);
      setSyntaxResult(data);
    } catch (err: any) {
      setSyntaxResult({
        valid: false,
        message: err.message || "Failed to validate syntax",
        errors: [{ line: null, column: null, message: err.message, text: "" }],
      });
    } finally {
      setSyntaxLoading(false);
    }
  };

  const handleDiagnoseTrace = async () => {
    setTraceLoading(true);
    try {
      const data = await diagnoseStackTrace(rawTrace, "f:\\Jarvis");
      setTraceResult(data);
    } catch (err: any) {
      console.error("Diagnosis failed:", err);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleGenerateDiff = async () => {
    setDiffLoading(true);
    try {
      const data = await generateCodeDiff(origContent, newContent, "patch_preview.py");
      setDiffResult(data);
    } catch (err: any) {
      console.error("Diff generation failed:", err);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleApplyPatch = async () => {
    if (!patchFilePath.trim()) return;
    setPatchLoading(true);
    setPatchStatusMessage(null);
    try {
      const res = await applyCodePatch(patchFilePath, newContent, patchReason);
      setPatchStatusMessage(`✅ Patch applied successfully! Snapshot ID: ${res.snapshot.id.slice(0, 8)}`);
      loadSnapshots();
    } catch (err: any) {
      setPatchStatusMessage(`❌ Patch application failed: ${err.message}`);
    } finally {
      setPatchLoading(false);
    }
  };

  const handleRollback = async (snapshotId: string) => {
    try {
      const res = await rollbackCodeSnapshot(snapshotId);
      setPatchStatusMessage(`✅ Snapshot restored: ${res.file_path}`);
      loadSnapshots();
    } catch (err: any) {
      setPatchStatusMessage(`❌ Rollback failed: ${err.message}`);
    }
  };

  const handleRunTest = async () => {
    setTestRunning(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await runControlledTest(testTarget, testSubpath.trim() || undefined, testTimeout);
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.message || "Failed to execute test suite");
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code className="h-6 w-6 text-indigo-400" />
            Coding Assistance
          </h1>
          <p className="text-sm text-gray-400">
            Sandboxed project inspection, Python AST syntax validation, stack trace diagnostics, rollback-protected
            patches, and controlled test execution.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab("inspector")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "inspector"
              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <FileSearch className="h-4 w-4" />
          Project Inspector & Search
        </button>
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "diagnostics"
              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Diagnostics & AST Syntax
        </button>
        <button
          onClick={() => setActiveTab("patcher")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "patcher"
              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <History className="h-4 w-4" />
          Diff, Patch & Rollback
        </button>
        <button
          onClick={() => setActiveTab("testrunner")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "testrunner"
              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Terminal className="h-4 w-4" />
          Controlled Test Runner
        </button>
      </div>

      {/* TAB 1: Inspector & Search */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Sandboxed Directory Inspection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Target Directory Path</label>
                <input
                  type="text"
                  value={inspectPath}
                  onChange={(e) => setInspectPath(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="f:\Jarvis"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Max Files</label>
                <input
                  type="number"
                  value={maxFiles}
                  onChange={(e) => setMaxFiles(Number(e.target.value))}
                  min={10}
                  max={1000}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleInspect}
                  disabled={inspectLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <RefreshCw className={`h-4 w-4 ${inspectLoading ? "animate-spin" : ""}`} />
                  {inspectLoading ? "Inspecting..." : "Inspect Workspace"}
                </button>
              </div>
            </div>

            {inspectError && (
              <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-sm text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                {inspectError}
              </div>
            )}

            {/* Inspection Summary */}
            {inspectResult && (
              <div className="pt-2 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-400 text-xs">Total Files Scanned</span>
                  <p className="text-lg font-semibold text-white">{inspectResult.total_files_scanned}</p>
                </div>
                <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-400 text-xs">Directories Traversed</span>
                  <p className="text-lg font-semibold text-white">{inspectResult.directory_count}</p>
                </div>
                <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-400 text-xs">Sandbox Boundary</span>
                  <p className="text-xs font-mono text-emerald-400 truncate">{inspectResult.root_path}</p>
                </div>
                <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-400 text-xs">Scan Status</span>
                  <p className="text-sm font-medium text-indigo-400">
                    {inspectResult.capped ? "⚠️ Reached file cap" : "✅ Complete"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Source Search Card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-400" />
              Symbol & Source Code Search
            </h2>
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search identifiers, functions, error strings (e.g. ProjectInspector or def test_)"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 pl-9 pr-4 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRegex}
                    onChange={(e) => setIsRegex(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-0"
                  />
                  Regex
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-0"
                  />
                  Match Case
                </label>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <Search className="h-4 w-4" />
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-sm text-red-400">
                {searchError}
              </div>
            )}

            {/* Search Results */}
            {searchResult && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Found {searchResult.total_matches} match(es)</span>
                  {searchResult.capped && <span className="text-amber-400">Results capped at 50</span>}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-gray-800 bg-gray-950 p-2">
                  {searchResult.matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-gray-900/60 hover:bg-gray-800/80 transition-colors border border-gray-800/50 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-indigo-400 font-semibold">{m.relative_path}</span>
                        <span className="text-gray-500">Line {m.line_number}</span>
                      </div>
                      <div className="text-gray-200 overflow-x-auto whitespace-pre">{m.line_content}</div>
                    </div>
                  ))}
                  {searchResult.matches.length === 0 && (
                    <p className="text-center py-4 text-xs text-gray-500">No matching occurrences found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Files Table */}
          {inspectResult && inspectResult.files.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <FileCode className="h-5 w-5 text-gray-400" />
                Indexed Workspace Files ({inspectResult.files.length})
              </h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-950/80 text-gray-400 uppercase font-medium border-b border-gray-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Relative Path</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Lines</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300">
                    {inspectResult.files.map((file, i) => (
                      <tr key={i} className="hover:bg-gray-800/40">
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          {file.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-xs">{file.relative_path}</td>
                        <td className="py-2 px-3 font-mono text-gray-400">{file.extension || "none"}</td>
                        <td className="py-2 px-3">{Math.round(file.size_bytes / 1024)} KB</td>
                        <td className="py-2 px-3 text-gray-400">{file.line_count ?? "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Diagnostics & AST Syntax */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-gray-800 pb-2">
            <button
              onClick={() => setDiagSubTab("syntax")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                diagSubTab === "syntax"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Python AST Syntax Validator
            </button>
            <button
              onClick={() => setDiagSubTab("trace")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                diagSubTab === "trace"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Stack Trace & Culprit Analyzer
            </button>
          </div>

          {diagSubTab === "syntax" ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-indigo-400" />
                  Line-Accurate AST Syntax Validation
                </h2>
                <p className="text-xs text-gray-400">
                  Parses source code into an abstract syntax tree to detect syntax errors before execution.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Python Source Code</label>
                <textarea
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 font-mono text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="def my_function():\n    pass\n"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleValidateSyntax}
                  disabled={syntaxLoading || !pythonCode.trim()}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {syntaxLoading ? "Validating AST..." : "Validate Syntax"}
                </button>
              </div>

              {syntaxResult && (
                <div
                  className={`rounded-lg p-4 border text-sm ${
                    syntaxResult.valid
                      ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                      : "border-red-500/30 bg-red-950/20 text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    {syntaxResult.valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    {syntaxResult.valid ? "Valid Python Syntax" : "Syntax Errors Detected"}
                  </div>
                  <p className="text-xs mb-2">{syntaxResult.message}</p>
                  {syntaxResult.errors.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {syntaxResult.errors.map((err, idx) => (
                        <div key={idx} className="rounded bg-black/40 p-2 font-mono text-xs text-gray-300">
                          <span className="text-red-400">Line {err.line ?? "?"}, Col {err.column ?? "?"}:</span>{" "}
                          {err.message}
                          {err.text && <div className="text-gray-400 mt-1 pl-2 border-l border-red-500">&gt; {err.text}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Structured Stack Trace & Culprit Analyzer
                </h2>
                <p className="text-xs text-gray-400">
                  Parses Python tracebacks and Node/JS stack traces, identifying the primary culprit frame in your workspace.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Raw Traceback Output</label>
                <textarea
                  value={rawTrace}
                  onChange={(e) => setRawTrace(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 font-mono text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Paste Python or JavaScript stack trace here..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleDiagnoseTrace}
                  disabled={traceLoading || !rawTrace.trim()}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <AlertCircle className="h-4 w-4" />
                  {traceLoading ? "Analyzing..." : "Diagnose Stack Trace"}
                </button>
              </div>

              {traceResult && (
                <div className="space-y-4 pt-2">
                  {/* Culprit Card */}
                  <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                        Detected: {traceResult.detected_language} ({traceResult.error_type})
                      </span>
                      <span className="text-xs text-gray-400">{traceResult.total_frames} Frames</span>
                    </div>
                    <p className="text-sm font-medium text-white">{traceResult.error_message}</p>
                    {traceResult.analysis.primary_culprit && (
                      <div className="rounded bg-black/40 p-2.5 font-mono text-xs border border-indigo-500/20">
                        <span className="text-amber-400 font-semibold">Primary Culprit:</span>{" "}
                        <span className="text-white">{traceResult.analysis.primary_culprit.file}</span>:
                        <span className="text-indigo-400">{traceResult.analysis.primary_culprit.line}</span> in{" "}
                        <span className="text-emerald-400">{traceResult.analysis.primary_culprit.function}</span>
                        {traceResult.analysis.primary_culprit.code && (
                          <div className="text-gray-300 mt-1 pl-2 border-l-2 border-indigo-500">
                            {traceResult.analysis.primary_culprit.code}
                          </div>
                        )}
                      </div>
                    )}
                    {traceResult.analysis.suggestions.length > 0 && (
                      <div className="pt-2 text-xs text-gray-300">
                        <span className="font-semibold text-gray-200">Actionable Suggestions:</span>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-gray-400">
                          {traceResult.analysis.suggestions.map((sug, i) => (
                            <li key={i}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Frame List */}
                  {traceResult.frames.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stack Call Sequence</h3>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {traceResult.frames.map((frame, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded border text-xs font-mono flex items-center justify-between ${
                              frame.is_local_project_file
                                ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-200"
                                : "bg-gray-900/60 border-gray-800 text-gray-400"
                            }`}
                          >
                            <div>
                              <span className="font-semibold">{frame.function}</span> at{" "}
                              <span className="text-gray-300">{frame.file}</span>:{frame.line}
                            </div>
                            {frame.is_local_project_file && (
                              <span className="text-xs bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                Workspace File
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Diff, Patch & Rollback */}
      {activeTab === "patcher" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor & Patch Form */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-indigo-400" />
                Atomic Patch Application
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Target File Path</label>
                <input
                  type="text"
                  value={patchFilePath}
                  onChange={(e) => setPatchFilePath(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs font-mono text-gray-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="f:\Jarvis\backend\app\..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Reason for Modification</label>
                <input
                  type="text"
                  value={patchReason}
                  onChange={(e) => setPatchReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Audit reason for change"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Original Content</label>
                <textarea
                  value={origContent}
                  onChange={(e) => setOrigContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-2 font-mono text-xs text-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Proposed New Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 p-2 font-mono text-xs text-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleGenerateDiff}
                  disabled={diffLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Preview Unified Diff
                </button>
                <button
                  onClick={handleApplyPatch}
                  disabled={patchLoading || !patchFilePath.trim()}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {patchLoading ? "Applying..." : "Apply Patch (Create Snapshot)"}
                </button>
              </div>

              {patchStatusMessage && (
                <div className="rounded-lg p-3 text-xs bg-gray-950 border border-gray-800 text-gray-200">
                  {patchStatusMessage}
                </div>
              )}
            </div>

            {/* Unified Diff Viewer */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-4 flex flex-col">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Unified Diff Preview
              </h2>
              <div className="flex-1 rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-xs overflow-auto max-h-96">
                {diffResult && diffResult.diff ? (
                  <pre className="whitespace-pre">
                    {diffResult.diff.split("\n").map((line, idx) => {
                      let color = "text-gray-400";
                      let bg = "bg-transparent";
                      if (line.startsWith("+") && !line.startsWith("+++")) {
                        color = "text-emerald-400";
                        bg = "bg-emerald-950/20";
                      } else if (line.startsWith("-") && !line.startsWith("---")) {
                        color = "text-red-400";
                        bg = "bg-red-950/20";
                      } else if (line.startsWith("@@")) {
                        color = "text-indigo-400 font-semibold";
                      }
                      return (
                        <div key={idx} className={`${color} ${bg} px-1 rounded-sm`}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                ) : (
                  <p className="text-gray-500 italic py-6 text-center">
                    No active diff preview. Click &apos;Preview Unified Diff&apos; to view additions and deletions.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Snapshot History Table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-400" />
                  Pre-Modification Snapshots & One-Click Rollback
                </h2>
                <p className="text-xs text-gray-400">
                  Every modification persists an immutable snapshot before touching disk, allowing instant full recovery.
                </p>
              </div>
              <button
                onClick={loadSnapshots}
                disabled={snapshotsLoading}
                className="p-1.5 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${snapshotsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/80 text-gray-400 uppercase font-medium border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Snapshot ID</th>
                    <th className="py-2.5 px-3">Target File</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-gray-800/40">
                      <td className="py-2 px-3 font-mono text-indigo-400 font-semibold">{snap.id.slice(0, 8)}</td>
                      <td className="py-2 px-3 font-mono text-gray-300 max-w-xs truncate">{snap.file_path}</td>
                      <td className="py-2 px-3 text-gray-400">{snap.reason}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            snap.restored
                              ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {snap.restored ? "Restored" : "Active"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {new Date(snap.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleRollback(snap.id)}
                          className="flex items-center gap-1 ml-auto text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30 transition-all"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Rollback
                        </button>
                      </td>
                    </tr>
                  ))}
                  {snapshots.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No code modification snapshots recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Controlled Test Runner */}
      {activeTab === "testrunner" && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-indigo-400" />
              Controlled Project Test Execution
            </h2>
            <p className="text-xs text-gray-400">
              Executes verified project test suites inside sandboxed directories with strictly enforced execution timeouts
              and non-shell process spawning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Test Target</label>
              <select
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value as "backend" | "frontend")}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="backend">Python Backend (pytest)</option>
                <option value="frontend">React Frontend (vitest)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Relative Subpath / Filter</label>
              <input
                type="text"
                value={testSubpath}
                onChange={(e) => setTestSubpath(e.target.value)}
                placeholder="tests/test_coding.py (or leave empty for full suite)"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Timeout (s)</label>
              <input
                type="number"
                value={testTimeout}
                onChange={(e) => setTestTimeout(Number(e.target.value))}
                min={10}
                max={600}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunTest}
                disabled={testRunning}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Play className={`h-4 w-4 ${testRunning ? "animate-pulse" : ""}`} />
                {testRunning ? "Running..." : "Run Tests"}
              </button>
            </div>
          </div>

          {testError && (
            <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-sm text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {testError}
            </div>
          )}

          {testResult && (
            <div className="space-y-3 pt-2">
              {/* Outcome Banner */}
              <div
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  testResult.passed
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                    : "bg-red-950/30 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResult.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  <div>
                    <h3 className="text-sm font-bold">{testResult.summary}</h3>
                    <p className="text-xs font-mono text-gray-400">
                      Executed: {testResult.command} (exit code: {testResult.exit_code})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-black/40 px-2.5 py-1 rounded border border-gray-800">
                  {testResult.elapsed_ms} ms
                </span>
              </div>

              {/* Console Output */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Console Output (stdout & stderr)
                </label>
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-xs max-h-80 overflow-y-auto space-y-2">
                  {testResult.stdout && (
                    <div>
                      <span className="text-gray-500 select-none">--- STDOUT ---</span>
                      <pre className="text-gray-300 whitespace-pre-wrap">{testResult.stdout}</pre>
                    </div>
                  )}
                  {testResult.stderr && (
                    <div>
                      <span className="text-red-400 select-none">--- STDERR ---</span>
                      <pre className="text-red-400 whitespace-pre-wrap">{testResult.stderr}</pre>
                    </div>
                  )}
                  {!testResult.stdout && !testResult.stderr && (
                    <p className="text-gray-500 italic">No console output produced.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
