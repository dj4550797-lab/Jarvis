import React from 'react';
import { HealthResponse, TaskItem, VoiceState } from '../types';
import { Hologram } from './Hologram';
import { CommandBar } from './CommandBar';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';

interface DashboardViewProps {
  health: HealthResponse | null;
  tasks: TaskItem[];
  voiceState: VoiceState;
  onToggleVoice: () => void;
  onSendCommand: (cmd: string, allowElevation: boolean) => Promise<void>;
  onApproveTask: (taskId: string) => Promise<void>;
  onCancelTask: (taskId: string) => Promise<void>;
  onRefresh: () => void;
  isSubmitting: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  health,
  tasks,
  voiceState,
  onToggleVoice,
  onSendCommand,
  onApproveTask,
  onCancelTask,
  onRefresh,
  isSubmitting,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Top Hero Section: Hologram & Quick Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Hologram Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Hologram voiceState={voiceState} />
          <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Primary Engine:</span>
              <strong style={{ color: 'var(--cyan-glow)' }}>{health?.local_ai.runtime}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Compute Target:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{health?.local_ai.device.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* State Summary & Metric Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Tasks
                </span>
                <Activity size={18} color="var(--cyan-glow)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {health?.database.total_tasks ?? tasks.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Persisted in SQLite WAL
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Memories
                </span>
                <FolderGit2 size={18} color="var(--purple-glow)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--purple-glow)' }}>
                {health?.database.total_memories ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Indexed with FTS5 search
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Storage Free
                </span>
                <CheckCircle2 size={18} color="var(--emerald)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
                {health?.system_resources.disk_free_gb ?? 0} GB
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Local NVMe / SSD headroom
              </div>
            </div>
          </div>

          {/* Universal Command Bar */}
          <CommandBar
            onSendCommand={onSendCommand}
            voiceState={voiceState}
            onToggleVoice={onToggleVoice}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Recent Activity & Task Center Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Task Operations</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time execution queue and autonomous planner activity
            </p>
          </div>
          <button onClick={onRefresh} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem' }}>No commands currently in progress.</p>
            <p style={{ fontSize: '0.8rem' }}>Enter a query in the command bar above to start an autonomous workflow.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'rgba(7, 10, 19, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          task.status === 'Completed'
                            ? 'rgba(0, 230, 118, 0.15)'
                            : task.status === 'AwaitingApproval'
                            ? 'rgba(255, 171, 0, 0.15)'
                            : task.status === 'Cancelled'
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(0, 240, 255, 0.15)',
                        color:
                          task.status === 'Completed'
                            ? 'var(--emerald)'
                            : task.status === 'AwaitingApproval'
                            ? 'var(--amber)'
                            : task.status === 'Cancelled'
                            ? 'var(--crimson)'
                            : 'var(--cyan-glow)',
                      }}
                    >
                      {task.status}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{task.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ID: {task.id.slice(0, 8)} • Device: {task.device_id} • Created: {new Date(task.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {task.status === 'AwaitingApproval' && (
                    <button
                      onClick={() => onApproveTask(task.id)}
                      className="cyber-button"
                      style={{
                        background: 'rgba(255, 171, 0, 0.2)',
                        borderColor: 'var(--amber)',
                        color: 'var(--amber)',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <AlertTriangle size={14} />
                      Approve Execution
                    </button>
                  )}

                  {['Queued', 'Running', 'AwaitingApproval'].includes(task.status) && (
                    <button
                      onClick={() => onCancelTask(task.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: 'var(--crimson)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
