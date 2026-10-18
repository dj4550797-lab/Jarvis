import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSearch,
  ListTodo,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  StopCircle,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  cancelTask,
  enqueueTask,
  fetchTasks,
  recoverTasks,
} from "../../services/api";
import { BackgroundTask, TaskEnqueuePayload, TaskStatusType } from "../../types";

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState<boolean>(false);
  const [detailTask, setDetailTask] = useState<BackgroundTask | null>(null);
  const [recovering, setRecovering] = useState<boolean>(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  // Launch Form State
  const [launchType, setLaunchType] = useState<"file_search" | "system_diagnostic" | "simulation">("system_diagnostic");
  const [taskName, setTaskName] = useState<string>("");
  const [searchPattern, setSearchPattern] = useState<string>(".*\\.py$");
  const [searchDir, setSearchDir] = useState<string>("f:\\Jarvis");
  const [maxResults, setMaxResults] = useState<number>(50);
  const [simSteps, setSimSteps] = useState<number>(6);
  const [simDelay, setSimDelay] = useState<number>(0.2);
  const [simFailStep, setSimFailStep] = useState<string>("");
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(180);
  const [launching, setLaunching] = useState<boolean>(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      const statusParam = selectedStatus === "all" ? undefined : selectedStatus;
      const data = await fetchTasks(statusParam);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load background tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // Auto-refresh tasks every 2.5s for live progress tracking
    const timer = setInterval(loadTasks, 2500);
    return () => clearInterval(timer);
  }, [selectedStatus]);

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
      await loadTasks();
    } catch (err: any) {
      alert(`Could not cancel task: ${err.message || err}`);
    }
  };

  const handleRecoverTasks = async () => {
    setRecovering(true);
    setRecoveryNotice(null);
    try {
      const res = await recoverTasks();
      if (res.interrupted_task_count > 0) {
        setRecoveryNotice(`Safely recovered ${res.interrupted_task_count} interrupted tasks.`);
      } else {
        setRecoveryNotice("No orphaned in-flight tasks detected. System state is clean.");
      }
      await loadTasks();
    } catch (err: any) {
      setRecoveryNotice(`Recovery error: ${err.message || err}`);
    } finally {
      setRecovering(false);
      setTimeout(() => setRecoveryNotice(null), 6000);
    }
  };

  const handleLaunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaunching(true);
    setLaunchError(null);

    let params: Record<string, any> = {};
    let defaultName = "";

    if (launchType === "file_search") {
      defaultName = `File Search: ${searchPattern}`;
      params = { pattern: searchPattern, directory: searchDir, max_results: maxResults };
    } else if (launchType === "system_diagnostic") {
      defaultName = "System Health Diagnostics Audit";
      params = {};
    } else if (launchType === "simulation") {
      defaultName = `Workload Simulation (${simSteps} steps)`;
      params = {
        steps: simSteps,
        step_delay: simDelay,
        fail_at_step: simFailStep ? parseInt(simFailStep, 10) : undefined,
      };
    }

    const payload: TaskEnqueuePayload = {
      name: taskName.trim() || defaultName,
      task_type: launchType,
      params,
      timeout_seconds: timeoutSeconds,
      idempotent: false,
    };

    try {
      await enqueueTask(payload);
      setIsLaunchModalOpen(false);
      setTaskName("");
      await loadTasks();
    } catch (err: any) {
      setLaunchError(err.message || "Failed to launch task");
    } finally {
      setLaunching(false);
    }
  };

  const runningCount = tasks.filter((t) => t.status === "running").length;
  const queuedCount = tasks.filter((t) => t.status === "queued").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed" || t.status === "interrupted").length;

  const renderStatusBadge = (status: TaskStatusType) => {
    switch (status) {
      case "running":
        return (
          <span className="badge badge-running">
            <RefreshCw size={12} className="spin-icon" /> RUNNING
          </span>
        );
      case "queued":
        return (
          <span className="badge badge-queued">
            <Clock size={12} /> QUEUED
          </span>
        );
      case "completed":
        return (
          <span className="badge badge-completed">
            <CheckCircle2 size={12} /> COMPLETED
          </span>
        );
      case "failed":
        return (
          <span className="badge badge-critical">
            <XCircle size={12} /> FAILED
          </span>
        );
      case "cancelled":
        return (
          <span className="badge badge-low">
            <StopCircle size={12} /> CANCELLED
          </span>
        );
      case "interrupted":
        return (
          <span className="badge badge-high">
            <AlertCircle size={12} /> INTERRUPTED
          </span>
        );
      default:
        return <span className="badge badge-low">{status}</span>;
    }
  };

  return (
    <div className="tasks-container">
      {/* Header and Telemetry Stats */}
      <div className="tasks-header">
        <div>
          <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ListTodo size={24} className="text-accent" />
            Background Tasks & Operations
          </h2>
          <p className="section-subtitle">
            Asynchronous worker engine with monotonic progress tracking, cancellation, and crash-safe recovery.
          </p>
        </div>

        <div className="tasks-header-actions">
          <button
            className="secondary-btn"
            onClick={handleRecoverTasks}
            disabled={recovering}
            title="Inspect and mark any orphaned in-flight tasks as interrupted"
          >
            <RotateCcw size={16} className={recovering ? "spin-icon" : ""} />
            <span>{recovering ? "Checking..." : "Inspect & Recover"}</span>
          </button>
          <button
            className="primary-btn"
            onClick={() => setIsLaunchModalOpen(true)}
          >
            <Play size={16} />
            <span>Launch New Task</span>
          </button>
        </div>
      </div>

      {recoveryNotice && (
        <div className="recovery-notice-banner">
          <ShieldCheck size={18} className="text-accent" />
          <span>{recoveryNotice}</span>
          <button className="icon-button" onClick={() => setRecoveryNotice(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="tasks-metric-grid">
        <div className="metric-card">
          <span className="metric-label">Running Tasks</span>
          <span className="metric-value text-accent">{runningCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Queued</span>
          <span className="metric-value">{queuedCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value text-success">{completedCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Failed / Interrupted</span>
          <span className="metric-value text-danger">{failedCount}</span>
        </div>
      </div>

      {/* Active Jobs Live Monitor */}
      {tasks.filter((t) => t.status === "running" || t.status === "queued").length > 0 && (
        <div className="active-jobs-section">
          <h3 className="sub-heading">Active In-Flight Operations</h3>
          <div className="active-jobs-list">
            {tasks
              .filter((t) => t.status === "running" || t.status === "queued")
              .map((task) => (
                <div key={task.id} className="active-job-card">
                  <div className="active-job-top">
                    <div>
                      <div className="active-job-title">{task.name}</div>
                      <span className="active-job-type">Type: {task.task_type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {renderStatusBadge(task.status)}
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelTask(task.id)}
                        title="Cancel task immediately"
                      >
                        <StopCircle size={14} /> Cancel
                      </button>
                    </div>
                  </div>

                  <div className="task-progress-wrapper">
                    <div className="task-progress-bar-bg">
                      <div
                        className="task-progress-bar-fill"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="task-progress-text">{task.progress.toFixed(1)}%</span>
                  </div>

                  <div className="active-job-message">
                    {task.progress_message || "Working..."}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter and Task History Table */}
      <div className="task-history-card">
        <div className="history-header">
          <h3 className="sub-heading" style={{ margin: 0 }}>Task Execution History</h3>
          <div className="history-filters">
            {["all", "running", "queued", "completed", "failed", "cancelled", "interrupted"].map((status) => (
              <button
                key={status}
                className={`filter-pill ${selectedStatus === status ? "active" : ""}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <ListTodo size={36} style={{ opacity: 0.3, marginBottom: "8px" }} />
            <p>No tasks found for the selected status.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                        {t.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{t.task_type}</span>
                    </td>
                    <td>{renderStatusBadge(t.status)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="table-progress-bg">
                          <div
                            className="table-progress-fill"
                            style={{
                              width: `${t.progress}%`,
                              backgroundColor:
                                t.status === "failed" || t.status === "interrupted"
                                  ? "var(--danger)"
                                  : t.status === "completed"
                                  ? "var(--success)"
                                  : "var(--accent-primary)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.82rem", minWidth: "40px" }}>{t.progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="action-icon-btn"
                          onClick={() => setDetailTask(t)}
                          title="View Details"
                        >
                          <Search size={14} /> Details
                        </button>
                        {(t.status === "running" || t.status === "queued") && (
                          <button
                            className="action-icon-btn action-icon-btn-danger"
                            onClick={() => handleCancelTask(t.id)}
                            title="Cancel"
                          >
                            <StopCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Launch Modal */}
      {isLaunchModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLaunchModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Play size={18} className="text-accent" />
                <span>Launch Background Task</span>
              </h3>
              <button className="icon-button" onClick={() => setIsLaunchModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchSubmit} className="modal-body">
              {launchError && (
                <div className="form-error-banner">
                  <AlertCircle size={16} /> {launchError}
                </div>
              )}

              {/* Task Type Tabs */}
              <div className="task-type-selector">
                <button
                  type="button"
                  className={`type-card ${launchType === "system_diagnostic" ? "active" : ""}`}
                  onClick={() => setLaunchType("system_diagnostic")}
                >
                  <Zap size={20} />
                  <span>System Diagnostics</span>
                </button>
                <button
                  type="button"
                  className={`type-card ${launchType === "file_search" ? "active" : ""}`}
                  onClick={() => setLaunchType("file_search")}
                >
                  <FileSearch size={20} />
                  <span>Deep File Search</span>
                </button>
                <button
                  type="button"
                  className={`type-card ${launchType === "simulation" ? "active" : ""}`}
                  onClick={() => setLaunchType("simulation")}
                >
                  <RefreshCw size={20} />
                  <span>Simulation</span>
                </button>
              </div>

              <div className="form-group">
                <label>Custom Task Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Full Security Scan"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="text-input"
                />
              </div>

              {/* Specific Parameters */}
              {launchType === "file_search" && (
                <div className="param-fields">
                  <div className="form-group">
                    <label>Regex Pattern</label>
                    <input
                      type="text"
                      value={searchPattern}
                      onChange={(e) => setSearchPattern(e.target.value)}
                      className="text-input font-mono"
                    />
                  </div>
                  <div className="form-group">
                    <label>Directory (Authorized Sandbox)</label>
                    <input
                      type="text"
                      value={searchDir}
                      onChange={(e) => setSearchDir(e.target.value)}
                      className="text-input font-mono"
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Matches</label>
                    <input
                      type="number"
                      value={maxResults}
                      min={1}
                      max={200}
                      onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
                      className="text-input"
                    />
                  </div>
                </div>
              )}

              {launchType === "simulation" && (
                <div className="param-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Stages</label>
                      <input
                        type="number"
                        value={simSteps}
                        min={1}
                        max={30}
                        onChange={(e) => setSimSteps(parseInt(e.target.value, 10))}
                        className="text-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stage Delay (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={simDelay}
                        min={0.05}
                        max={5}
                        onChange={(e) => setSimDelay(parseFloat(e.target.value))}
                        className="text-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Simulate Failure at Step (optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4 (leaves empty for success)"
                      value={simFailStep}
                      onChange={(e) => setSimFailStep(e.target.value)}
                      className="text-input"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Timeout Limit (seconds)</label>
                <input
                  type="number"
                  value={timeoutSeconds}
                  min={5}
                  max={1800}
                  onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10))}
                  className="text-input"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsLaunchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={launching}
                >
                  <Play size={16} />
                  <span>{launching ? "Enqueuing..." : "Start Background Task"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {detailTask && (
        <div className="modal-backdrop" onClick={() => setDetailTask(null)}>
          <div className="modal-dialog modal-dialog-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Task Details: {detailTask.name}</h3>
              <button className="icon-button" onClick={() => setDetailTask(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body font-mono">
              <div className="detail-row">
                <span className="detail-key">Task ID:</span>
                <span className="detail-val">{detailTask.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Type:</span>
                <span className="detail-val">{detailTask.task_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Status:</span>
                <span className="detail-val">{renderStatusBadge(detailTask.status)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Progress:</span>
                <span className="detail-val">{detailTask.progress.toFixed(1)}% ({detailTask.progress_message || "None"})</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Created:</span>
                <span className="detail-val">{detailTask.created_at}</span>
              </div>
              {detailTask.completed_at && (
                <div className="detail-row">
                  <span className="detail-key">Completed:</span>
                  <span className="detail-val">{detailTask.completed_at}</span>
                </div>
              )}
              {detailTask.error && (
                <div className="detail-row error-highlight">
                  <span className="detail-key">Error:</span>
                  <span className="detail-val">{detailTask.error}</span>
                </div>
              )}

              <div className="code-block-section">
                <div className="code-block-title">Parameters:</div>
                <pre className="json-block">{JSON.stringify(detailTask.params, null, 2)}</pre>
              </div>

              {detailTask.result && (
                <div className="code-block-section">
                  <div className="code-block-title">Result Payload:</div>
                  <pre className="json-block">{JSON.stringify(detailTask.result, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
