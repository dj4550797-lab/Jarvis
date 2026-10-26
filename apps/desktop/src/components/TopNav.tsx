import React from 'react';
import { HealthResponse } from '../types';
import { Shield, Cpu, HardDrive, Database, Radio, Sparkles } from 'lucide-react';

interface TopNavProps {
  health: HealthResponse | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ health, activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'commands', label: 'Command Centre' },
    { id: 'voice', label: 'Voice Studio' },
    { id: 'tasks', label: 'Task Centre' },
    { id: 'memory', label: 'Memory' },
    { id: 'vault', label: 'Knowledge Vault' },
    { id: 'models', label: 'Local Models' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 10, 19, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Upper Status Ribbon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--cyan-glow)" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
              JARVIS
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px' }}>
              v{health?.version || '0.1.0'}
            </span>
          </div>

          <span className={health?.mode === 'offline' ? 'badge badge-offline' : 'badge badge-online'}>
            <Shield size={12} />
            {health?.mode === 'offline' ? 'Zero-API Offline Mode' : 'Online / Hybrid'}
          </span>
        </div>

        {/* Live System Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="var(--cyan-glow)" />
            <span>SQLite WAL:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {health?.database.connected ? 'Active' : 'Connecting...'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="var(--purple-glow)" />
            <span>CPU:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{health?.system_resources.cpu_pct ?? 0}%</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={14} color="var(--emerald)" />
            <span>RAM:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {health ? `${Math.round(health.system_resources.ram_used_mb / 1024)}GB / ${Math.round(health.system_resources.ram_total_mb / 1024)}GB` : '...'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} color="var(--cyan-glow)" />
            <span>Model:</span>
            <strong style={{ color: 'var(--cyan-glow)' }}>
              {health?.local_ai.model_loaded || 'Offline GGUF Engine Ready'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav style={{ display: 'flex', gap: '4px', padding: '6px 24px', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--cyan-glow)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--cyan-glow)' : '2px solid transparent',
                padding: '10px 18px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
