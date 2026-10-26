import React from 'react';
import { Terminal, Shield, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const SelfDevelopmentPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal color="var(--cyan-glow)" size={24} />
            Self-Development Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Controlled code self-modification sandbox with Git diff verification, test gates, and rollback recovery.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Automated Test Gates Enforced
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Safe Development Lifecycle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { step: '1. Inspect', desc: 'Audit repo state & tests' },
            { step: '2. Propose Diff', desc: 'Generate branch modification' },
            { step: '3. Run Tests', desc: 'Pytest & Vite typecheck must pass' },
            { step: '4. Commit & Sync', desc: 'Atomic commit with rollback point' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px', background: 'rgba(7, 10, 19, 0.5)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--cyan-glow)' }}>
              <strong style={{ fontSize: '0.88rem', color: 'var(--cyan-glow)' }}>{s.step}</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
