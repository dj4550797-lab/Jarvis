import React, { useState } from 'react';
import { VoiceState } from '../types';
import { Mic, Radio, Volume2, Sliders, Shield, Play } from 'lucide-react';

interface VoiceStudioPageProps {
  voiceState: VoiceState;
  onToggleVoice: () => void;
}

export const VoiceStudioPage: React.FC<VoiceStudioPageProps> = ({ voiceState, onToggleVoice }) => {
  const [wakeWord, setWakeWord] = useState('Jarvis');
  const [sensitivity, setSensitivity] = useState(0.65);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [testSpeechText, setTestSpeechText] = useState('Greetings, Administrator. All local neural sub-systems are operating within nominal parameters.');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleTestSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    setIsSynthesizing(true);
    const utterance = new SpeechSynthesisUtterance(testSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSynthesizing(false);
    utterance.onerror = () => setIsSynthesizing(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio color="var(--cyan-glow)" size={24} />
            Voice & Conversation Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Local wake-word detector, offline speech recognition state machine, and neural audio synthesizer.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Offline Speech Engine
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Voice State Machine & Audio Core */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Audio State Machine</h3>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background:
                  voiceState === 'listening'
                    ? 'rgba(0, 230, 118, 0.2)'
                    : voiceState === 'processing'
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(0, 240, 255, 0.1)',
                border: `2px solid ${
                  voiceState === 'listening'
                    ? 'var(--emerald)'
                    : voiceState === 'processing'
                    ? 'var(--purple-glow)'
                    : 'var(--cyan-glow)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px var(--cyan-glow-subtle)',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
              onClick={onToggleVoice}
            >
              <Mic size={40} color={voiceState === 'listening' ? 'var(--emerald)' : 'var(--cyan-glow)'} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <span className="badge" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                CURRENT STATE: {voiceState.toUpperCase()}
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Click icon to manually toggle microphone listening state
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speech Recognition:</span>
              <p style={{ fontWeight: 600, color: 'var(--cyan-glow)' }}>Whisper / Local Engine</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audio Fallback:</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Text Interaction</p>
            </div>
          </div>
        </div>

        {/* Right: Wake Word & Speech Synthesis Settings */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--purple-glow)" />
            Voice Engine Configuration
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Wake Word</label>
              <input
                type="text"
                value={wakeWord}
                onChange={(e) => setWakeWord(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wake Sensitivity</span>
                <span style={{ color: 'var(--cyan-glow)' }}>{Math.round(sensitivity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-glow)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Language & Accent</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              >
                <option value="en-US">English (US Neural)</option>
                <option value="en-IN">English (India Accent)</option>
                <option value="hi-IN">Hindi (India)</option>
                <option value="hinglish">Hinglish (Hybrid Recognition)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Test Neural Audio Synthesis</label>
              <textarea
                rows={2}
                value={testSpeechText}
                onChange={(e) => setTestSpeechText(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
              <button
                onClick={handleTestSpeech}
                disabled={isSynthesizing}
                className="cyber-button"
                style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
              >
                <Volume2 size={16} />
                {isSynthesizing ? 'Synthesizing Speech...' : 'Play Test Speech'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
