import React, { useState } from 'react';
import { Sparkles, Sliders, Shield } from 'lucide-react';
import { Hologram } from '../components/Hologram';
import { VoiceState } from '../types';

export const HologramStudioPage: React.FC = () => {
  const [testState, setTestState] = useState<VoiceState>('idle');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles color="var(--cyan-glow)" size={24} />
            Hologram Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Interactive 3D particle canvas visualizer customization, shader shaders, and reactive audio physics.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          GPU / Canvas Accelerated
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Hologram voiceState={testState} />
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Visual Physics & Testing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Simulate dynamic audio reactive states without fake animations:
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['idle', 'listening', 'processing', 'speaking', 'error'] as VoiceState[]).map((st) => (
              <button
                key={st}
                onClick={() => setTestState(st)}
                style={{
                  background: testState === st ? 'var(--cyan-glow-subtle)' : 'transparent',
                  border: `1px solid ${testState === st ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                  color: testState === st ? 'var(--cyan-glow)' : 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
