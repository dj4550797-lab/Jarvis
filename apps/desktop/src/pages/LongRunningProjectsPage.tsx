import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Shield, Play, Pause } from 'lucide-react';

export const LongRunningProjectsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock color="var(--cyan-glow)" size={24} />
            Long-Running Project Mode
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Durable checkpoint-based project orchestration for overnight tasks and multi-hour workflows.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Durable SQLite Checkpoints
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Active Long-Running Project: Master JARVIS Build</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Autonomous multi-phase development pipeline tracking Phases 0 through 10.
        </p>

        {/* Milestones Progress Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {[
            { phase: 'Phase 0 — Repository Audit & Planning', status: 'Completed', notes: 'Git repo initialized, canonical Markdown documentation created, commit e077525.' },
            { phase: 'Phase 1 — Foundation & Scaffolding', status: 'Completed', notes: 'FastAPI backend, SQLite WAL migrations, React desktop UI, Android skeleton, commit f881e3d.' },
            { phase: 'Phase 2 — Design System & 32-Page Layout', status: 'In Progress', notes: 'Building modular 32-page dashboard layout and real state routing.' },
            { phase: 'Phase 3 — Providers & Offline Voice', status: 'Pending', notes: 'Llama.cpp local GGUF runner and speech state machine.' },
            { phase: 'Phase 4 — Persistent Context & Vault', status: 'Pending', notes: 'SQLite FTS5 full-text indexing and semantic search.' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${m.status === 'Completed' ? 'var(--emerald)' : m.status === 'In Progress' ? 'var(--cyan-glow)' : 'var(--border-subtle)'}` }}>
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{m.phase}</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.notes}</p>
              </div>
              <span className={`badge ${m.status === 'Completed' ? 'badge-success' : m.status === 'In Progress' ? 'badge-offline' : ''}`} style={{ fontSize: '0.72rem' }}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
