import React, { useEffect, useState } from "react";
import {
  cancelAgentRun,
  getAgentCapabilities,
  getAgentRun,
  listAgentRuns,
  startAgentRun,
  stepAgentRun,
} from "../../services/api";
import { AgentCapability, AgentWorkflowRun } from "../../types";

export const AgentsView: React.FC = () => {
  const [capabilities, setCapabilities] = useState<AgentCapability[]>([]);
  const [runs, setRuns] = useState<AgentWorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<AgentWorkflowRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New Run Form State
  const [goal, setGoal] = useState("");
  const [initialAgent, setInitialAgent] = useState("PlanningAgent");
  const [maxSteps, setMaxSteps] = useState(5);

  // Step Controls State
  const [stepTargetAgent, setStepTargetAgent] = useState("");
  const [stepIntent, setStepIntent] = useState("progress_task");

  useEffect(() => {
    loadCapabilitiesAndRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRunDetails(selectedRunId);
    }
  }, [selectedRunId]);

  const loadCapabilitiesAndRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const [caps, runList] = await Promise.all([
        getAgentCapabilities(),
        listAgentRuns(20),
      ]);
      setCapabilities(caps);
      setRuns(runList);
      if (runList.length > 0 && !selectedRunId) {
        setSelectedRunId(runList[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load agent capabilities.");
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const run = await getAgentRun(runId);
      setSelectedRun(run);
      if (capabilities.length > 0 && !stepTargetAgent) {
        setStepTargetAgent(run.agent_type || capabilities[0].name);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch run details.");
    }
  };

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newRun = await startAgentRun({
        goal: goal.trim(),
        initial_agent: initialAgent,
        max_steps: Number(maxSteps),
      });
      setGoal("");
      await loadCapabilitiesAndRuns();
      setSelectedRunId(newRun.id);
    } catch (err: any) {
      setError(err.message || "Failed to start agent workflow run.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepRun = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await stepAgentRun(
        selectedRunId,
        stepTargetAgent || undefined,
        stepIntent || "progress_task"
      );
      setSelectedRun(updated);
      await loadCapabilitiesAndRuns();
    } catch (err: any) {
      setError(err.message || "Failed to execute agent step.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRun = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await cancelAgentRun(selectedRunId);
      setSelectedRun(updated);
      await loadCapabilitiesAndRuns();
    } catch (err: any) {
      setError(err.message || "Failed to cancel run.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100 p-6 overflow-y-auto" id="agents-view-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-400">
              Multi-Agent Orchestration Engine
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Central orchestration with strict tool allowlists, loop prevention, and traceable agent-to-agent message flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
            <span className="text-emerald-400 font-bold">✓</span>
            Anti-Loop Turn Cap: <span className="text-cyan-400 font-bold">10 max</span>
          </div>
        </div>
      </div>

      {error && (
        <div id="agents-error-banner" className="my-4 p-4 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Section 1: Immutable Agent Capability Matrix */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Specialized Agents & Immutable Permissions ({capabilities.length})
          </h2>
          <span className="text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-800/50 flex items-center gap-1">
            <span>🔒</span> Non-escalatable: Agents cannot grant themselves additional tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" id="capabilities-matrix">
          {capabilities.map((agent) => (
            <div
              key={agent.name}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-violet-300">{agent.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Agent</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{agent.role}</p>

                <div className="mb-3">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">Allowed Tools:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.allowed_tools.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 line-clamp-2 italic">
                {agent.system_prompt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Workflow Runner & Tracing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0">
        {/* Left: Dispatcher & Run List */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          {/* Dispatcher Form */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Dispatch New Multi-Agent Run
            </h3>
            <form onSubmit={handleStartRun} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Goal / Objective</label>
                <textarea
                  required
                  rows={2}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Plan and coordinate audio analysis pipeline for gaming telemetry"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Agent</label>
                  <select
                    value={initialAgent}
                    onChange={(e) => setInitialAgent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    {capabilities.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Turns (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxSteps}
                    onChange={(e) => setMaxSteps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                id="start-run-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-950/40 disabled:opacity-50"
              >
                {loading ? "Initializing..." : "Start Multi-Agent Workflow"}
              </button>
            </form>
          </div>

          {/* Workflow Runs List */}
          <div className="flex-1 flex flex-col rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 shadow-xl overflow-hidden">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Workflow Runs ({runs.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="agent-runs-list">
              {runs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No workflow runs yet. Dispatch a run above to test coordination.
                </div>
              ) : (
                runs.map((r) => {
                  const isSelected = r.id === selectedRunId;
                  const isRunning = r.status === "running";
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRunId(r.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border text-left ${
                        isSelected
                          ? "bg-violet-950/40 border-violet-500/60 shadow-md shadow-violet-950/30"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isRunning ? "bg-amber-950 text-amber-300 border border-amber-800" :
                          r.status === "completed" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                          "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}>
                          {r.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Step {r.current_step}/{r.max_steps}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate">{r.goal}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-500">
                        <span>Agent: {r.agent_type}</span>
                        <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Execution Trace Viewer */}
        <div className="lg:col-span-2 flex flex-col rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-xl backdrop-blur-md">
          {!selectedRun ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a workflow run to inspect its step-by-step agent communication traces.
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              {/* Run Header & Status */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {selectedRun.goal}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>ID: <code className="text-slate-300">{selectedRun.id.slice(0, 8)}</code></span>
                    <span>•</span>
                    <span>Current Agent: <strong className="text-violet-300">{selectedRun.agent_type}</strong></span>
                    <span>•</span>
                    <span>Progress: <strong className="text-cyan-400">{selectedRun.current_step} of {selectedRun.max_steps} turns</strong></span>
                  </div>
                </div>

                {selectedRun.status === "running" && (
                  <button
                    id="cancel-run-btn"
                    onClick={handleCancelRun}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg hover:bg-rose-900/50"
                  >
                    Cancel Workflow
                  </button>
                )}
              </div>

              {selectedRun.error_message && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-lg">
                  <strong>Halt Reason:</strong> {selectedRun.error_message}
                </div>
              )}

              {/* Step Forward Action Bar (if running) */}
              {selectedRun.status === "running" && (
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Target Agent:</label>
                      <select
                        value={stepTargetAgent}
                        onChange={(e) => setStepTargetAgent(e.target.value)}
                        className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700"
                      >
                        {capabilities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Intent:</label>
                      <input
                        type="text"
                        value={stepIntent}
                        onChange={(e) => setStepIntent(e.target.value)}
                        placeholder="e.g. progress_task"
                        className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    id="step-run-btn"
                    onClick={handleStepRun}
                    disabled={loading}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow disabled:opacity-50"
                  >
                    {loading ? "Executing Step..." : "Advance Next Step ➔"}
                  </button>
                </div>
              )}

              {/* Trace Log Timeline */}
              <div className="flex-1 overflow-y-auto space-y-3" id="agent-trace-log">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Traceable Message Timeline ({selectedRun.trace_log.length} steps)
                </h4>

                {selectedRun.trace_log.map((trace, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          Step {trace.step_index}
                        </span>
                        <span className="text-slate-400 font-semibold">{trace.from_agent}</span>
                        <span className="text-cyan-400">➔</span>
                        <span className="text-violet-300 font-bold">{trace.to_agent}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                          {trace.intent}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(trace.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/60 text-xs font-mono text-slate-200 overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(trace.payload, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion Output Summary */}
              {selectedRun.output_payload && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-emerald-300">✓ Workflow Final Result</div>
                  <pre className="text-slate-200 font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedRun.output_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AgentsView;
