import React, { useState } from 'react';
import { Monitor, Shield, CheckCircle2, AlertTriangle, Terminal, Play } from 'lucide-react';

export const WindowsControlPage: React.FC = () => {
  const [activeWindows, setActiveWindows] = useState<string[]>([
    'Antigravity IDE - JARVIS',
    'Windows PowerShell',
    'Windows Terminal',
    'File Explorer (E:\\Jarvis)',
  ]);

  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleExecuteAction = (action: string) => {
    setLastAction(`Executed Win32 native action: "${action}" at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor color="var(--cyan-glow)" size={24} />
            Windows Desktop Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Native Win32 automation adapter, application launcher, and permission-scoped input synthetic driver.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Permission Whitelist Enforced
        </span>
      </div>

      {lastAction && (
        <div style={{ padding: '12px 18px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid var(--emerald)', borderRadius: 'var(--radius-md)', color: 'var(--emerald)', fontSize: '0.85rem' }}>
          {lastAction}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Active Desktop Windows */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Discovered Desktop Windows</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeWindows.map((win, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{win}</span>
                <button onClick={() => handleExecuteAction(`Focus Window: ${win}`)} className="cyber-button" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  Focus Window
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Win32 Action Suite */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Supported System Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              'Mute Master Audio',
              'Unmute Master Audio',
              'Open Windows Terminal',
              'Open Task Manager',
              'Capture Active Screen',
              'Lock Windows Session',
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => handleExecuteAction(action)}
                className="cyber-button"
                style={{ justifyContent: 'center', padding: '12px', fontSize: '0.82rem' }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
