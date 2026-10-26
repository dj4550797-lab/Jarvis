import React, { useState, useEffect } from 'react';
import { Terminal, Shield, RefreshCw, Search, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchLogs, fetchAuditTrail } from '../services/api';

export const LogsDiagnosticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'audit'>('logs');
  const [logs, setLogs] = useState<string[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      if (activeTab === 'logs') {
        const res = await fetchLogs(150);
        setLogs(res.lines);
      } else {
        const res = await fetchAuditTrail(50);
        setAuditTrail(res);
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
    if (!autoRefresh) return;
    const interval = setInterval(loadDiagnostics, 4000);
    return () => clearInterval(interval);
  }, [activeTab, autoRefresh]);

  const filteredLogs = logs.filter(line => {
    const matchesSearch = line.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || line.includes(`[${filterLevel}]`) || line.includes(`"level": "${filterLevel}"`);
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Logs & Diagnostics Centre</h1>
            <p className="text-xs text-gray-400">Page 25 • Structured Application Logs, Redaction Scanner & Audit Trail</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
          >
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={loadDiagnostics}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'logs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Application Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Security Audit Trail ({auditTrail.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'logs' && (
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search stream..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Log Console View */}
      {activeTab === 'logs' ? (
        <div className="cyber-glass p-4 rounded-2xl">
          <div className="bg-black/80 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[500px] space-y-1 border border-white/5">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 py-6 text-center">No log messages found matching query.</div>
            ) : (
              filteredLogs.map((line, idx) => {
                const isError = line.includes('ERROR') || line.includes('CRITICAL');
                const isWarn = line.includes('WARNING');
                return (
                  <div
                    key={idx}
                    className={`leading-relaxed py-0.5 px-2 rounded hover:bg-white/5 transition-colors ${
                      isError ? 'text-red-400 bg-red-950/20' :
                      isWarn ? 'text-amber-400' :
                      'text-gray-300'
                    }`}
                  >
                    {line}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="cyber-glass p-6 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/20 text-gray-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Actor / Subsystem</th>
                  <th className="py-2 px-3">Action Type</th>
                  <th className="py-2 px-3">Resource Target</th>
                  <th className="py-2 px-3">Verification Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {auditTrail.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No audit events recorded in current database.</td>
                  </tr>
                ) : (
                  auditTrail.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2.5 px-3 text-gray-400">{item.timestamp || '2026-10-26T20:50:00Z'}</td>
                      <td className="py-2.5 px-3 text-cyan-300 font-semibold">{item.actor || 'SYSTEM_CORE'}</td>
                      <td className="py-2.5 px-3 text-white">{item.action || 'TASK_APPROVAL'}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{item.target || '/api/v1/tasks'}</td>
                      <td className="py-2.5 px-3 text-emerald-400 text-[10px] truncate max-w-xs">{item.hash || 'sha256:e3b0c44298fc...'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
