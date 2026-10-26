import React, { useEffect, useState, useCallback } from 'react';
import { HealthResponse, TaskItem, VoiceState } from './types';
import { fetchHealth, fetchTasks, submitCommand, approveTask, cancelTask } from './services/api';
import { wsClient } from './services/websocket';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';

// Page Imports (Pages 2 - 32)
import { CommandCentrePage } from './pages/CommandCentrePage';
import { VoiceStudioPage } from './pages/VoiceStudioPage';
import { ContextualMemoryPage } from './pages/ContextualMemoryPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { KnowledgeVaultPage } from './pages/KnowledgeVaultPage';
import { MultiAgentPage } from './pages/MultiAgentPage';
import { LongRunningProjectsPage } from './pages/LongRunningProjectsPage';
import { ScreenAwarenessPage } from './pages/ScreenAwarenessPage';
import { VisualAutomationPage } from './pages/VisualAutomationPage';
import { WindowsControlPage } from './pages/WindowsControlPage';
import { AndroidControlPage } from './pages/AndroidControlPage';
import { BrowserControlPage } from './pages/BrowserControlPage';
import { MessagingAutomationPage } from './pages/MessagingAutomationPage';
import { ModelProvidersPage } from './pages/ModelProvidersPage';
import { ResearchModePage } from './pages/ResearchModePage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { SelfDevelopmentPage } from './pages/SelfDevelopmentPage';
import { ModelEvolutionPage } from './pages/ModelEvolutionPage';
import { FileIntelligencePage } from './pages/FileIntelligencePage';
import { GodsEyePage } from './pages/GodsEyePage';
import { HologramStudioPage } from './pages/HologramStudioPage';
import { SecurityPermissionsPage } from './pages/SecurityPermissionsPage';
import { TaskCentrePage } from './pages/TaskCentrePage';
import { LogsDiagnosticsPage } from './pages/LogsDiagnosticsPage';
import { HealthMonitorPage } from './pages/HealthMonitorPage';
import { BackupRecoveryPage } from './pages/BackupRecoveryPage';
import { UsbRecoveryPage } from './pages/UsbRecoveryPage';
import { CrossDeviceHandoffPage } from './pages/CrossDeviceHandoffPage';
import { SettingsCustomizationPage } from './pages/SettingsCustomizationPage';
import { OnboardingWizardPage } from './pages/OnboardingWizardPage';
import { AdminProjectControlPage } from './pages/AdminProjectControlPage';

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
    loadData();

    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg) => {
      if (msg.event?.startsWith('task.')) {
        fetchTasks(10).then((res) => setTasks(res.tasks)).catch(() => {});
      }
      if (msg.event === 'voice.state' && msg.data) {
        const d = msg.data as { state?: VoiceState };
        if (d.state) setVoiceState(d.state);
      }
    });

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
    <div className="min-h-screen flex flex-col bg-[#070a13] text-gray-200">
      <TopNav health={health} activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1">
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

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {activeTab === 'command-centre' && (
            <CommandCentrePage
              tasks={tasks}
              voiceState={voiceState}
              onToggleVoice={handleToggleVoice}
              onSendCommand={handleSendCommand}
              onApproveTask={handleApproveTask}
              onCancelTask={handleCancelTask}
              isSubmitting={isSubmitting}
            />
          )}
          {activeTab === 'voice-studio' && (
            <VoiceStudioPage
              voiceState={voiceState}
              onToggleVoice={handleToggleVoice}
            />
          )}
          {activeTab === 'contextual-memory' && <ContextualMemoryPage />}
          {activeTab === 'knowledge-graph' && <KnowledgeGraphPage />}
          {activeTab === 'knowledge-vault' && <KnowledgeVaultPage />}
          {activeTab === 'multi-agent' && <MultiAgentPage />}
          {activeTab === 'long-running' && <LongRunningProjectsPage />}
          {activeTab === 'screen-awareness' && <ScreenAwarenessPage />}
          {activeTab === 'visual-automation' && <VisualAutomationPage />}
          {activeTab === 'windows-control' && <WindowsControlPage />}
          {activeTab === 'android-control' && <AndroidControlPage />}
          {activeTab === 'browser-control' && <BrowserControlPage />}
          {activeTab === 'messaging-automation' && <MessagingAutomationPage />}
          {activeTab === 'models-providers' && <ModelProvidersPage />}
          {activeTab === 'research-mode' && <ResearchModePage />}
          {activeTab === 'model-evaluation' && <ModelEvaluationPage />}
          {activeTab === 'self-development' && <SelfDevelopmentPage />}
          {activeTab === 'model-evolution' && <ModelEvolutionPage />}
          {activeTab === 'file-intelligence' && <FileIntelligencePage />}
          {activeTab === 'gods-eye' && <GodsEyePage />}
          {activeTab === 'hologram-studio' && <HologramStudioPage />}
          {activeTab === 'security-centre' && <SecurityPermissionsPage />}
          {activeTab === 'task-centre' && <TaskCentrePage />}
          {activeTab === 'logs-diagnostics' && <LogsDiagnosticsPage />}
          {activeTab === 'health-monitor' && <HealthMonitorPage />}
          {activeTab === 'backup-recovery' && <BackupRecoveryPage />}
          {activeTab === 'usb-recovery' && <UsbRecoveryPage />}
          {activeTab === 'cross-device' && <CrossDeviceHandoffPage />}
          {activeTab === 'settings' && <SettingsCustomizationPage />}
          {activeTab === 'onboarding' && <OnboardingWizardPage />}
          {activeTab === 'admin-control' && <AdminProjectControlPage />}
        </div>
      </main>
    </div>
  );
};

export default App;
