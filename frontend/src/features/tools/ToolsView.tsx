import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileCode,
  FileSearch,
  FileText,
  FolderOpen,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  controlEmergencyStop,
  executeTool,
  fetchEmergencyStopStatus,
  fetchToolAuditLogs,
  fetchTools,
} from "../../services/api";
import { EmergencyStopStatus, ToolAuditLog, ToolMetadata, ToolResult } from "../../types";

export const ToolsView: React.FC = () => {
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStopStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<ToolAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tool runner states
  const [selectedTool, setSelectedTool] = useState<string>("file_search");
  const [paramInputs, setParamInputs] = useState<Record<string, any>>({
    pattern: "*.md",
    directory: ".",
  });
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ToolResult | null>(null);

  // Emergency stop confirmation dialog state
  const [resetConfirmChecked, setResetConfirmChecked] = useState<boolean>(false);
  const [isUpdatingEmergency, setIsUpdatingEmergency] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tList, emStatus, logs] = await Promise.all([
        fetchTools(),
        fetchEmergencyStopStatus(),
        fetchToolAuditLogs(30).catch(() => []),
      ]);
      setTools(tList);
      setEmergencyStatus(emStatus);
      setAuditLogs(logs);

      if (tList.length > 0 && !selectedTool) {
        handleSelectTool(tList[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tools and operations data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const em = await fetchEmergencyStopStatus();
        setEmergencyStatus(em);
      } catch {
        // Ignore interval poll errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTool = (name: string) => {
    setSelectedTool(name);
    setExecutionResult(null);
    if (name === "file_search") {
      setParamInputs({ pattern: "*.md", directory: "." });
    } else if (name === "file_read") {
      setParamInputs({ path: "README.md" });
    } else if (name === "file_write") {
      setParamInputs({ path: "notes.txt", content: "JARVIS operational note.", confirmed: false });
    } else if (name === "app_launch") {
      setParamInputs({ application: "notepad", arguments: [] });
    } else {
      setParamInputs({});
    }
  };

  const handleExecute = async (overrideParams?: Record<string, any>) => {
    try {
      setIsExecuting(true);
      setError(null);
      const paramsToRun = overrideParams || paramInputs;
      const res = await executeTool(selectedTool, paramsToRun);
      setExecutionResult(res);
      // Refresh audit logs
      const updatedLogs = await fetchToolAuditLogs(30).catch(() => []);
      setAuditLogs(updatedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tool execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEngageEmergencyStop = async () => {
    try {
      setIsUpdatingEmergency(true);
      const updated = await controlEmergencyStop("engage", "Manually engaged by user from console.");
      setEmergencyStatus(updated);
      setExecutionResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to engage emergency stop.");
    } finally {
      setIsUpdatingEmergency(false);
    }
  };

  const handleResetEmergencyStop = async () => {
    if (!resetConfirmChecked) return;
    try {
      setIsUpdatingEmergency(true);
      const updated = await controlEmergencyStop("reset", undefined, true);
      setEmergencyStatus(updated);
      setResetConfirmChecked(false);
      // Refresh audit logs
      const updatedLogs = await fetchToolAuditLogs(30).catch(() => []);
      setAuditLogs(updatedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset emergency stop.");
    } finally {
      setIsUpdatingEmergency(false);
    }
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "file_search":
        return <FileSearch className="w-4 h-4 text-cyan-400" />;
      case "file_read":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case "file_write":
        return <FileCode className="w-4 h-4 text-amber-400" />;
      case "app_launch":
        return <FolderOpen className="w-4 h-4 text-purple-400" />;
      case "system_status":
        return <Cpu className="w-4 h-4 text-blue-400" />;
      default:
        return <Terminal className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (loading && tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
        <p className="text-sm font-medium">Initializing tool security registry & capabilities...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Controlled Computer Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sandboxed tool execution, approval safeguards, action logging, and instant emergency stop.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global Emergency Stop Banner */}
      <div
        className={`p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          emergencyStatus?.is_active
            ? "bg-red-950/80 border-red-600 text-red-200 shadow-lg shadow-red-950/50"
            : "bg-slate-900/60 border-slate-800 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-3.5">
          {emergencyStatus?.is_active ? (
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 animate-pulse">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider">
                {emergencyStatus?.is_active ? "EMERGENCY STOP ENGAGED" : "SYSTEM SAFETY OPERATIONAL"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  emergencyStatus?.is_active
                    ? "bg-red-900 text-white border border-red-500"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {emergencyStatus?.is_active ? "BLOCKED" : "ARMED"}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {emergencyStatus?.is_active
                ? `All tool actions halted: "${emergencyStatus.reason || "Manual stop"}"`
                : "All tool operations pass through path traversal guards and sandboxing."}
            </p>
          </div>
        </div>

        <div>
          {emergencyStatus?.is_active ? (
            <div className="flex items-center gap-3 bg-red-900/40 p-2 rounded border border-red-700/50">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetConfirmChecked}
                  onChange={(e) => setResetConfirmChecked(e.target.checked)}
                  className="rounded bg-slate-900 border-red-500 text-red-600 focus:ring-0"
                />
                <span className="text-red-200">Confirm Reset</span>
              </label>
              <button
                onClick={handleResetEmergencyStop}
                disabled={!resetConfirmChecked || isUpdatingEmergency}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Stop
              </button>
            </div>
          ) : (
            <button
              onClick={handleEngageEmergencyStop}
              disabled={isUpdatingEmergency}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-md shadow-red-950/60 border border-red-500 hover:scale-[1.02]"
            >
              <AlertOctagon className="w-4 h-4" />
              EMERGENCY STOP
            </button>
          )}
        </div>
      </div>

      {/* Tool Catalog & Interactive Runner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Catalog List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Approved Tool Catalog ({tools.length})
          </h2>
          <div className="space-y-2">
            {tools.map((t) => (
              <div
                key={t.name}
                onClick={() => handleSelectTool(t.name)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedTool === t.name
                    ? "bg-slate-800/80 border-cyan-500/80 shadow-md shadow-cyan-950/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-100">
                    {getToolIcon(t.name)}
                    {t.name}
                  </div>
                  {t.requires_confirmation && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
                      confirmation
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>Capability:</span>
                  <span className="text-cyan-400">{t.capability}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Tool Runner & Execution Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                {getToolIcon(selectedTool)}
                <span className="text-sm font-bold text-slate-100 font-mono">{selectedTool}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {tools.find((t) => t.name === selectedTool)?.capability}
              </span>
            </div>

            {/* Parameter Inputs according to selected tool */}
            <div className="space-y-3 mb-4">
              {selectedTool === "file_search" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Pattern</label>
                    <input
                      type="text"
                      value={paramInputs.pattern || ""}
                      onChange={(e) => setParamInputs({ ...paramInputs, pattern: e.target.value })}
                      placeholder="*.py, *.md"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Directory</label>
                    <input
                      type="text"
                      value={paramInputs.directory || ""}
                      onChange={(e) => setParamInputs({ ...paramInputs, directory: e.target.value })}
                      placeholder="."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {selectedTool === "file_read" && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">File Path</label>
                  <input
                    type="text"
                    value={paramInputs.path || ""}
                    onChange={(e) => setParamInputs({ ...paramInputs, path: e.target.value })}
                    placeholder="README.md"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {selectedTool === "file_write" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">File Path</label>
                    <input
                      type="text"
                      value={paramInputs.path || ""}
                      onChange={(e) => setParamInputs({ ...paramInputs, path: e.target.value })}
                      placeholder="output.txt"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">File Content</label>
                    <textarea
                      rows={3}
                      value={paramInputs.content || ""}
                      onChange={(e) => setParamInputs({ ...paramInputs, content: e.target.value })}
                      placeholder="Content to write..."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedTool === "app_launch" && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Application</label>
                  <select
                    value={paramInputs.application || "notepad"}
                    onChange={(e) => setParamInputs({ ...paramInputs, application: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    <option value="notepad">notepad (Text Editor)</option>
                    <option value="calc">calc (Calculator)</option>
                    <option value="explorer">explorer (File Explorer)</option>
                  </select>
                </div>
              )}

              {selectedTool === "system_status" && (
                <p className="text-xs text-slate-400">
                  Queries CPU, RAM, and disk utilization safely without parameters.
                </p>
              )}
            </div>

            {/* Confirmation Safeguard Warning Card */}
            {executionResult && executionResult.requires_confirmation && (
              <div className="p-3 bg-amber-950/60 border border-amber-700/60 rounded-md mb-4 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-semibold mb-1 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Confirmation Safeguard Required
                </div>
                <p className="mb-3">{executionResult.confirmation_prompt}</p>
                <button
                  onClick={() => handleExecute({ ...paramInputs, confirmed: true })}
                  disabled={isExecuting}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  Confirm & Proceed
                </button>
              </div>
            )}

            {/* Run Button */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => handleExecute()}
                disabled={isExecuting || emergencyStatus?.is_active}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors"
              >
                {isExecuting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isExecuting ? "Executing..." : "Execute Tool"}
              </button>
            </div>
          </div>

          {/* Execution Output Panel */}
          {executionResult && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  {executionResult.success ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold font-mono">
                      <XCircle className="w-3.5 h-3.5" /> FAILED
                    </span>
                  )}
                </div>
                {executionResult.metadata?.execution_time_ms && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    {executionResult.metadata.execution_time_ms} ms
                  </span>
                )}
              </div>

              {executionResult.error && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300 font-mono mb-3">
                  {executionResult.error}
                </div>
              )}

              {executionResult.output && (
                <pre className="p-3 bg-slate-950/80 rounded border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-64">
                  {typeof executionResult.output === "object"
                    ? JSON.stringify(executionResult.output, null, 2)
                    : executionResult.output}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Audit Trail Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Recent Action Audit Trail ({auditLogs.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Event / Tool</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Execution Latency</th>
                <th className="py-2 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-100">{log.event_type}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        log.severity === "INFO"
                          ? "bg-slate-800 text-slate-300"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {log.details?.success ? (
                      <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> success
                      </span>
                    ) : (
                      <span className="text-rose-400 text-xs flex items-center gap-1 font-mono">
                        <XCircle className="w-3 h-3" /> failed
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                    {log.details?.elapsed_ms ? `${log.details.elapsed_ms}ms` : "-"}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "-"}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No tool execution audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
