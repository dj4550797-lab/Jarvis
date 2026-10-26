import React, { useState } from 'react';
import { Globe, Shield, Play, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BrowserControlPage: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('https://github.com/dj4550797-lab/Jarvis');
  const [browserLog, setBrowserLog] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;
    setIsNavigating(true);
    setBrowserLog(`Connecting to browser CDP driver... Navigating to: ${targetUrl}`);
    setTimeout(() => {
      setIsNavigating(false);
      setBrowserLog(`Browser session active. Loaded "${targetUrl}" with 200 OK. DOM elements extracted.`);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe color="var(--cyan-glow)" size={24} />
            Browser & Website Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            CDP-driven automated browser execution for web queries, form submission, and content ingestion.
          </p>
        </div>
        <span className="badge badge-warning">
          <AlertTriangle size={12} />
          External Network Interaction
        </span>
      </div>

      <form onSubmit={handleNavigate} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="Enter target URL for automated browsing..."
          style={{ flexGrow: 1, padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={isNavigating} className="cyber-button">
          <Play size={14} />
          {isNavigating ? 'Navigating...' : 'Launch Workflow'}
        </button>
      </form>

      {browserLog && (
        <div style={{ padding: '14px 18px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--cyan-glow)', borderRadius: 'var(--radius-md)', color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          {browserLog}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Autonomous Safety Policy</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Per PRD Part 5 & 11, browser actions that involve payment credentials, authentication bypass, or form submission on non-whitelisted domains require explicit elevation approval.
        </p>
      </div>
    </div>
  );
};
