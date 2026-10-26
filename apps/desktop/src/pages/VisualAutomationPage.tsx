import React, { useState } from 'react';
import { Network, Play, Plus, Shield, CheckCircle2, Terminal } from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  title: string;
  details: string;
}

export const VisualAutomationPage: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'trigger', title: 'Trigger: Voice Command', details: 'Matches phrase "Morning Briefing"' },
    { id: '2', type: 'action', title: 'Action: Query Health Monitor', details: 'Check CPU/RAM and disk storage headroom' },
    { id: '3', type: 'action', title: 'Action: Contextual Memory', details: 'Retrieve active project goals and pending tasks' },
    { id: '4', type: 'action', title: 'Action: Neural Speech Synthesis', details: 'Speak summary through selected TTS voice' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState<string | null>(null);

  const handleRun = () => {
    setIsRunning(true);
    setRunLog('Executing workflow node pipeline: [Voice Trigger] -> [Health Query] -> [Memory Context] -> [Speech Synthesis]...');
    setTimeout(() => {
      setIsRunning(false);
      setRunLog('Workflow completed successfully in 1.2s. 4/4 nodes executed with 0 errors.');
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Network color="var(--purple-glow)" size={24} />
            Visual Automation Builder
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Graph-based visual pipeline orchestrator linking triggers, conditional logic, and platform actions.
          </p>
        </div>
        <button onClick={handleRun} disabled={isRunning} className="cyber-button">
          <Play size={16} />
          {isRunning ? 'Executing...' : 'Run Test Pipeline'}
        </button>
      </div>

      {runLog && (
        <div style={{ padding: '12px 18px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--cyan-glow)', borderRadius: 'var(--radius-md)', color: 'var(--cyan-glow)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          {runLog}
        </div>
      )}

      {/* Visual Pipeline Nodes */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pipeline Nodes Flow</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflowX: 'auto', paddingBottom: '10px' }}>
          {nodes.map((n, i) => (
            <React.Fragment key={n.id}>
              <div
                style={{
                  minWidth: '220px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(7, 10, 19, 0.6)',
                  border: '1px solid var(--border-active)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <span
                  className="badge"
                  style={{
                    fontSize: '0.65rem',
                    marginBottom: '8px',
                    background: n.type === 'trigger' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                    color: n.type === 'trigger' ? 'var(--emerald)' : 'var(--cyan-glow)',
                  }}
                >
                  {n.type.toUpperCase()}
                </span>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>{n.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.details}</p>
              </div>
              {i < nodes.length - 1 && (
                <div style={{ color: 'var(--cyan-glow)', fontSize: '1.2rem', fontWeight: 800 }}>➔</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
