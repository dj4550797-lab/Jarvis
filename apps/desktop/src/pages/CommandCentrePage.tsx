import React, { useState } from 'react';
import { TaskItem, VoiceState } from '../types';
import { CommandBar } from '../components/CommandBar';
import { Terminal, Shield, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface CommandCentrePageProps {
  tasks: TaskItem[];
  voiceState: VoiceState;
  onToggleVoice: () => void;
  onSendCommand: (cmd: string, allowElevation: boolean) => Promise<void>;
  onApproveTask: (taskId: string) => Promise<void>;
  onCancelTask: (taskId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const CommandCentrePage: React.FC<CommandCentrePageProps> = ({
  tasks,
  voiceState,
  onToggleVoice,
  onSendCommand,
  onApproveTask,
  onCancelTask,
  isSubmitting,
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(tasks[0] || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal color="var(--cyan-glow)" size={24} />
            Universal Command Centre
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Natural language instruction pipeline, multi-step decomposition, and approval controls.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Strict Policy Enforcement Active
        </span>
      </div>

      <CommandBar
        onSendCommand={onSendCommand}
        voiceState={voiceState}
        onToggleVoice={onToggleVoice}
        isSubmitting={isSubmitting}
      />

      {/* Task Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', marginTop: '10px' }}>
        {/* Left: Task Queue List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            Active & Recent Commands ({tasks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedTask?.id === t.id ? 'var(--bg-elevated)' : 'rgba(7, 10, 19, 0.4)',
                  border: `1px solid ${selectedTask?.id === t.id ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{t.status}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString()}</span>
                </div>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>{t.title}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Task Detailed Execution Plan */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {selectedTask ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    TASK ID: {selectedTask.id}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedTask.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedTask.status === 'AwaitingApproval' && (
                    <button onClick={() => onApproveTask(selectedTask.id)} className="cyber-button" style={{ background: 'rgba(255, 171, 0, 0.2)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                      <AlertTriangle size={14} /> Approve Execution
                    </button>
                  )}
                  {['Queued', 'Running', 'AwaitingApproval'].includes(selectedTask.status) && (
                    <button onClick={() => onCancelTask(selectedTask.id)} className="cyber-button" style={{ borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(7, 10, 19, 0.5)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Level:</span>
                  <p style={{ fontWeight: 700, color: selectedTask.risk_level === 'High' ? 'var(--amber)' : 'var(--emerald)' }}>{selectedTask.risk_level}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executing Device:</span>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTask.device_id}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approval Required:</span>
                  <p style={{ fontWeight: 600, color: selectedTask.requires_approval ? 'var(--amber)' : 'var(--text-secondary)' }}>
                    {selectedTask.requires_approval ? 'Yes (Elevated)' : 'No (Autonomous)'}
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Raw Command Context:</h4>
                <pre style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                  {selectedTask.command_raw}
                </pre>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Decomposed Execution Steps:</h4>
                {selectedTask.steps.length === 0 ? (
                  <div style={{ padding: '18px', textAlign: 'center', background: 'rgba(7, 10, 19, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                    <Clock size={20} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.85rem' }}>Step decomposition queued for autonomous planning engine.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTask.steps.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--cyan-glow)' }}>
                        <CheckCircle2 size={16} color="var(--emerald)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.action_type}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p>Select a command from the left panel to inspect execution telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
