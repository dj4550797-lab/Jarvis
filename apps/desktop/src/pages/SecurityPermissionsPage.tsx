import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, Sliders, Zap } from 'lucide-react';

interface PermissionRule {
  id: string;
  subsystem: string;
  description: string;
  riskTier: 1 | 2 | 3;
  allowed: boolean;
  requiresConfirmation: boolean;
}

export const SecurityPermissionsPage: React.FC = () => {
  const [offlineLock, setOfflineLock] = useState<boolean>(true);
  const [strictAudit, setStrictAudit] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<PermissionRule[]>([
    { id: 'fs_read', subsystem: 'Filesystem (Read)', description: 'Read workspace files and documents for context', riskTier: 1, allowed: true, requiresConfirmation: false },
    { id: 'fs_write', subsystem: 'Filesystem (Write/Modify)', description: 'Edit or create source code and configuration files', riskTier: 2, allowed: true, requiresConfirmation: true },
    { id: 'fs_delete', subsystem: 'Filesystem (Destructive Delete)', description: 'Purge files or directories permanently', riskTier: 3, allowed: false, requiresConfirmation: true },
    { id: 'net_local', subsystem: 'Network (Localhost IPC)', description: 'FastAPI backend communication on 127.0.0.1', riskTier: 1, allowed: true, requiresConfirmation: false },
    { id: 'net_wan', subsystem: 'Network (External WAN)', description: 'Outbound HTTP sockets to external cloud APIs', riskTier: 3, allowed: false, requiresConfirmation: true },
    { id: 'shell_exec', subsystem: 'Process Execution', description: 'Run shell commands and compiler toolchains', riskTier: 2, allowed: true, requiresConfirmation: true },
    { id: 'mic_input', subsystem: 'Audio Hardware (Mic)', description: 'Listen for wake words and voice commands locally', riskTier: 2, allowed: true, requiresConfirmation: false },
    { id: 'screen_cap', subsystem: 'Display (Screen Capture)', description: 'Real-time desktop OCR and window inspection', riskTier: 2, allowed: true, requiresConfirmation: true },
    { id: 'win32_input', subsystem: 'Native Input Automation', description: 'Simulate keyboard strokes and mouse movements', riskTier: 3, allowed: true, requiresConfirmation: true },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, allowed: !p.allowed } : p))
    );
  };

  const toggleConfirmation = (id: string) => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, requiresConfirmation: !p.requiresConfirmation } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">Security & Permissions Centre</h1>
              <p className="text-xs text-gray-400">Page 23 • Zero-Trust Risk Tier Policy Matrix & Isolation Locks</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOfflineLock(!offlineLock)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              offlineLock
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            <Lock className="w-4 h-4" />
            {offlineLock ? 'ENFORCED OFFLINE LOCK: ACTIVE' : 'OFFLINE LOCK: DISABLED (HYBRID)'}
          </button>
        </div>
      </div>

      {/* Risk Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-glass p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tier 1: Read-Only / Benign</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-gray-400 mb-3">Safe local introspection, FTS5 queries, and telemetry reads. Automatically approved without modal interrupts.</p>
          <div className="text-[11px] font-mono text-gray-300 bg-black/40 p-2 rounded-lg">Auto-approval: Enabled</div>
        </div>

        <div className="cyber-glass p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Tier 2: Controlled State Change</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-gray-400 mb-3">Local file edits, process execution, screen OCR. Requires session authorization or configured auto-consent.</p>
          <div className="text-[11px] font-mono text-gray-300 bg-black/40 p-2 rounded-lg">Verification: Per-Task Scope</div>
        </div>

        <div className="cyber-glass p-5 rounded-2xl border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Tier 3: Critical & External</span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xs text-gray-400 mb-3">WAN socket calls, file deletion, registry updates. Non-bypassable explicit human confirmation required.</p>
          <div className="text-[11px] font-mono text-gray-300 bg-black/40 p-2 rounded-lg">Confirmation: Mandatory Modal</div>
        </div>
      </div>

      {/* Permission Table */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Granular Capability Policy Matrix
          </h2>
          <span className="text-xs text-gray-400 font-mono">{permissions.length} Policies Configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyan-500/20 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Subsystem</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-center">Risk Tier</th>
                <th className="py-3 px-3 text-center">Execution Access</th>
                <th className="py-3 px-3 text-center">Prompt Confirmation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {permissions.map((rule) => (
                <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{rule.subsystem}</td>
                  <td className="py-3 px-3 text-gray-300 font-sans">{rule.description}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rule.riskTier === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      rule.riskTier === 2 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      Tier {rule.riskTier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => togglePermission(rule.id)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                        rule.allowed
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {rule.allowed ? 'ALLOWED' : 'DENIED'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => toggleConfirmation(rule.id)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                        rule.requiresConfirmation
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {rule.requiresConfirmation ? 'REQUIRED' : 'BYPASS'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Controls */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-sm font-semibold text-white">Immutable Audit Trail Logging</div>
            <div className="text-xs text-gray-400">All task approvals, policy evaluations, and tool calls are written to SQLite audit log with cryptographic hash verification.</div>
          </div>
        </div>
        <button
          onClick={() => setStrictAudit(!strictAudit)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            strictAudit ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}
        >
          {strictAudit ? 'STRICT AUDIT: ENABLED' : 'AUDIT: MINIMAL'}
        </button>
      </div>
    </div>
  );
};
