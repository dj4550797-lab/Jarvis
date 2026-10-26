import React, { useEffect, useState, useCallback } from 'react';
import { HealthResponse, TaskItem, VoiceState } from './types';
import { fetchHealth, fetchTasks, submitCommand, approveTask, cancelTask } from './services/api';
import { wsClient } from './services/websocket';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [h, t] = await Promise.all([fetchHealth(), fetchTasks(10)]);
      setHealth(h);
      setTasks(t.tasks);
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    loadData();

    // Connect WebSocket
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg) => {
      if (msg.event?.startsWith('task.')) {
        // Reload tasks on task updates
        fetchTasks(10).then((res) => setTasks(res.tasks)).catch(() => {});
      }
      if (msg.event === 'voice.state' && msg.data) {
        const d = msg.data as { state?: VoiceState };
        if (d.state) setVoiceState(d.state);
      }
    });

    // Poll health periodically
    const interval = setInterval(loadData, 4000);

    return () => {
      clearInterval(interval);
      unsubscribe();
      wsClient.disconnect();
    };
  }, [loadData]);

  const handleSendCommand = async (command: string, allowElevation: boolean) => {
    setIsSubmitting(true);
    try {
      await submitCommand({ command, allow_elevation: allowElevation });
      await loadData();
    } catch (err) {
      console.error('Failed to dispatch command:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVoice = () => {
    setVoiceState((prev) => (prev === 'idle' ? 'listening' : 'idle'));
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      await approveTask(taskId);
      await loadData();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
      await loadData();
    } catch (err) {
      console.error('Cancellation failed:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav health={health} activeTab={activeTab} onSelectTab={setActiveTab} />

      <main style={{ flexGrow: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            health={health}
            tasks={tasks}
            voiceState={voiceState}
            onToggleVoice={handleToggleVoice}
            onSendCommand={handleSendCommand}
            onApproveTask={handleApproveTask}
            onCancelTask={handleCancelTask}
            onRefresh={loadData}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab !== 'dashboard' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--cyan-glow)', marginBottom: '8px' }}>
                {activeTab.toUpperCase()} VIEW
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Component module mapped to Phase 2 architecture. Returning to Dashboard recommended.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="cyber-button"
                style={{ marginTop: '20px' }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
