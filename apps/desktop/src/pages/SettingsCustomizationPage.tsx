import React, { useState } from 'react';
import { Settings, Lock, Shield, Volume2, Database, Sliders, CheckCircle2 } from 'lucide-react';

export const SettingsCustomizationPage: React.FC = () => {
  const [offlineMode, setOfflineMode] = useState<boolean>(true);
  const [modelDir, setModelDir] = useState<string>('E:\\Jarvis\\models');
  const [dataDir, setDataDir] = useState<string>('E:\\Jarvis\\data');
  const [wakeWord, setWakeWord] = useState<string>('Hey Jarvis');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = () => {
    setSavedMsg('Settings persisted to local configuration store.');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Settings & System Customization</h1>
            <p className="text-xs text-gray-400">Page 30 • Operating Modes, Voice Synthesizer, Storage & Privacy Policies</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Save Configuration
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 font-mono animate-fadeIn">
          {savedMsg}
        </div>
      )}

      {/* Dual Mode Switch */}
      <div className="cyber-glass p-6 rounded-2xl border-l-4 border-l-cyan-500 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Execution Mode: Enforced Local vs Hybrid</h2>
              <p className="text-xs text-gray-400">Control external socket access and cloud provider capability</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setOfflineMode(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                offlineMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400'
              }`}
            >
              Enforced 100% Offline
            </button>
            <button
              onClick={() => setOfflineMode(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !offlineMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400'
              }`}
            >
              Hybrid Online Mode
            </button>
          </div>
        </div>

        <div className="p-4 bg-black/30 rounded-xl text-xs font-sans text-gray-300">
          {offlineMode ? (
            <span className="text-emerald-400 font-medium">
              Offline Lock Active: Outbound internet access is strictly forbidden. All reasoning operates via llama.cpp/GGUF, speech synthesis via local Piper-TTS, and memory queries via SQLite WAL + FTS5. Zero telemetry is transmitted.
            </span>
          ) : (
            <span className="text-cyan-400 font-medium">
              Hybrid Mode Active: Optional cloud AI providers (OpenAI, Anthropic, Gemini, DeepSeek) are permitted when configured with valid user-provided API keys. Fallback to local offline models is automatic during disconnects.
            </span>
          )}
        </div>
      </div>

      {/* Storage and Models Path */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Persistence & Repository Paths
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-gray-400 block text-[11px] uppercase">GGUF Model Weights Directory</label>
            <input
              type="text"
              value={modelDir}
              onChange={(e) => setModelDir(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-400 block text-[11px] uppercase">SQLite Database & Memories Directory</label>
            <input
              type="text"
              value={dataDir}
              onChange={(e) => setDataDir(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Voice & Synthesis Parameters */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          Voice & Interaction Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5 font-mono">
            <label className="text-gray-400 block text-[11px] uppercase">Wake Word Trigger Phrase</label>
            <input
              type="text"
              value={wakeWord}
              onChange={(e) => setWakeWord(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 font-mono">
            <label className="text-gray-400 block text-[11px] uppercase">TTS Speech Speed: {ttsSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
              className="w-full mt-2 accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5 font-mono">
            <label className="text-gray-400 block text-[11px] uppercase">Episodic Memory Retention</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="30">30 Days</option>
              <option value="90">90 Days (Recommended)</option>
              <option value="365">1 Year</option>
              <option value="-1">Indefinite (Never Expire)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
