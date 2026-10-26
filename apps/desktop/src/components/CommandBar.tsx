import React, { useState } from 'react';
import { Send, Mic, ShieldAlert, Sparkles } from 'lucide-react';
import { VoiceState } from '../types';

interface CommandBarProps {
  onSendCommand: (command: string, allowElevation: boolean) => Promise<void>;
  voiceState: VoiceState;
  onToggleVoice: () => void;
  isSubmitting: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSendCommand,
  voiceState,
  onToggleVoice,
  isSubmitting,
}) => {
  const [input, setInput] = useState('');
  const [allowElevation, setAllowElevation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;
    const cmd = input.trim();
    setInput('');
    await onSendCommand(cmd, allowElevation);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onToggleVoice}
          title={voiceState === 'listening' ? 'Mute Microphone' : 'Start Voice Listening'}
          style={{
            background:
              voiceState === 'listening'
                ? 'rgba(0, 230, 118, 0.2)'
                : 'rgba(0, 240, 255, 0.1)',
            border: `1px solid ${voiceState === 'listening' ? 'var(--emerald)' : 'var(--border-active)'}`,
            borderRadius: 'var(--radius-md)',
            color: voiceState === 'listening' ? 'var(--emerald)' : 'var(--cyan-glow)',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
            flexShrink: 0,
          }}
        >
          <Mic size={20} />
        </button>

        <div style={{ position: 'relative', flexGrow: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct JARVIS (e.g. 'Audit SQLite database and list pending tasks')..."
            style={{
              width: '100%',
              padding: '13px 18px',
              background: 'rgba(7, 10, 19, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'var(--transition-smooth)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--cyan-glow)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="cyber-button"
          style={{
            height: '46px',
            padding: '0 20px',
            opacity: !input.trim() || isSubmitting ? 0.5 : 1,
            cursor: !input.trim() || isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? (
            <Sparkles size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          <span>Execute</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowElevation}
            onChange={(e) => setAllowElevation(e.target.checked)}
            style={{ accentColor: 'var(--cyan-glow)', cursor: 'pointer' }}
          />
          <span style={{ color: allowElevation ? 'var(--amber)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={13} />
            Authorize Elevated OS Actions
          </span>
        </label>

        <span>Press <kbd style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> to submit</span>
      </div>
    </form>
  );
};
