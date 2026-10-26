import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Clock, Search } from 'lucide-react';
import { fetchTasks, approveTask, cancelTask } from '../services/api';
import { TaskItem, TaskStatus } from '../types';

export const TaskCentrePage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetchTasks(50);
      setTasks(res.tasks);
      if (res.tasks.length > 0 && !selectedTask) {
        setSelectedTask(res.tasks[0]);
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionMessage(`Approving task ${id}...`);
      const updated = await approveTask(id);
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedTask?.id === id) setSelectedTask(updated);
      setActionMessage(`Task ${id} approved successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Failed to approve: ${err.message}`);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setActionMessage(`Cancelling task ${id}...`);
      const updated = await cancelTask(id);
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedTask?.id === id) setSelectedTask(updated);
      setActionMessage(`Task ${id} cancelled.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Failed to cancel: ${err.message}`);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.command_raw.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Task Centre & Execution Engine</h1>
            <p className="text-xs text-gray-400">Page 24 • Real-Time Lifecycle Orchestration & Approval Controls</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTasks}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 font-mono animate-fadeIn">
          {actionMessage}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
          {(['all', 'Queued', 'Running', 'AwaitingApproval', 'Completed', 'Failed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Main Grid: Task List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="cyber-glass p-8 rounded-2xl text-center text-gray-500 text-xs">
              No tasks found matching current filter or search criteria.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={`cyber-glass p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTask?.id === t.id
                    ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10 bg-cyan-950/20'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-200">{t.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status === 'Running' ? 'bg-cyan-500/20 text-cyan-400' :
                        t.status === 'AwaitingApproval' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 font-sans line-clamp-1">{t.command_raw}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.status === 'AwaitingApproval' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(t.id); }}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/30"
                      >
                        Approve
                      </button>
                    )}
                    {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancel(t.id); }}
                        className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold hover:bg-red-500/30"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Created: {new Date(t.created_at).toLocaleTimeString()}</span>
                  <span>Steps: {t.steps ? t.steps.length : 0}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Task Inspector */}
        <div className="cyber-glass p-5 rounded-2xl h-fit space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 border-b border-white/10 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Task Detail Inspector
          </h2>

          {selectedTask ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Task ID</span>
                <span className="text-cyan-300 break-all">{selectedTask.id}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Status</span>
                <span className="text-white font-bold">{selectedTask.status}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Command</span>
                <div className="p-2 bg-black/40 rounded-lg text-gray-300 font-sans text-xs mt-1">
                  {selectedTask.command_raw}
                </div>
              </div>

              {selectedTask.result_summary && (
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Execution Output</span>
                  <div className="p-2 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs mt-1">
                    {selectedTask.result_summary}
                  </div>
                </div>
              )}

              {selectedTask.error_details && (
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Error Log</span>
                  <div className="p-2 bg-red-950/20 border border-red-500/30 rounded-lg text-red-300 text-xs mt-1">
                    {selectedTask.error_details}
                  </div>
                </div>
              )}

              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Lifecycle Timeline</span>
                <div className="text-[11px] text-gray-400 space-y-1 mt-1">
                  <div>Created: {selectedTask.created_at}</div>
                  <div>Updated: {selectedTask.updated_at}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2">
                {selectedTask.status === 'AwaitingApproval' && (
                  <button
                    onClick={() => handleApprove(selectedTask.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-center"
                  >
                    Confirm & Execute
                  </button>
                )}
                {selectedTask.status !== 'Completed' && selectedTask.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancel(selectedTask.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-center"
                  >
                    Abort Task
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-8 text-center">Select a task to inspect details</div>
          )}
        </div>
      </div>
    </div>
  );
};
