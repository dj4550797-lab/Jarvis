import React, { useState } from 'react';
import { Layers, Shield, Play, Pause, RefreshCw, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

interface AgentPersona {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'paused' | 'evaluating';
  currentTask: string;
  throughput: string;
}

export const MultiAgentPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentPersona[]>([
    { id: 'ag-1', name: 'Executive Orchestrator', role: 'Decomposes high-level instructions into atomic tasks', status: 'active', currentTask: 'Monitoring system health and event bus', throughput: '14 op/s' },
    { id: 'ag-2', name: 'Knowledge Researcher', role: 'Searches local documents and queries FTS5 index', status: 'idle', currentTask: 'Awaiting search dispatch', throughput: '0 op/s' },
    { id: 'ag-3', name: 'Automation Engineer', role: 'Executes desktop Win32, screen OCR, and browser workflows', status: 'idle', currentTask: 'Standby for elevation prompts', throughput: '0 op/s' },
    { id: 'ag-4', name: 'Security Auditor', role: 'Inspects permission boundaries, secrets, and risk tiers', status: 'active', currentTask: 'Enforcing zero-API offline firewall', throughput: '32 checks/s' },
  ]);

  const handleToggleStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers color="var(--cyan-glow)" size={24} />
            Multi-Agent Workbench
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Coordinated multi-agent execution pipeline with state leasing and conflict arbitration.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Agent Isolation
        </span>
      </div>

      {/* Agents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {agents.map((ag) => (
          <div key={ag.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 8px', marginBottom: '6px' }}>
                  {ag.status === 'active' ? '● RUNNING' : ag.status === 'paused' ? '❚❚ PAUSED' : '○ IDLE'}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ag.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ag.role}</p>
              </div>
              <button
                onClick={() => handleToggleStatus(ag.id)}
                className="cyber-button"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                {ag.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                {ag.status === 'active' ? 'Pause' : 'Resume'}
              </button>
            </div>

            <div style={{ background: 'rgba(7, 10, 19, 0.5)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Work:</span>
                <span style={{ color: 'var(--cyan-glow)', fontWeight: 600 }}>{ag.throughput}</span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                {ag.currentTask}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
