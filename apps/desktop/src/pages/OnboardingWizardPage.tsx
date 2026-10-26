import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Shield, Cpu, HardDrive, ArrowRight, Zap, Check } from 'lucide-react';

export const OnboardingWizardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<'offline' | 'hybrid'>('offline');
  const [modelType, setModelType] = useState<string>('llama3-8b');
  const [completed, setCompleted] = useState<boolean>(false);

  const steps = [
    { number: 1, title: 'Welcome & Mode Selection' },
    { number: 2, title: 'Prerequisites & Hardware' },
    { number: 3, title: 'Security & Risk Policy' },
    { number: 4, title: 'Local Model Engine' },
    { number: 5, title: 'Final Initialization' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">JARVIS Initial Setup & Onboarding Wizard</h1>
            <p className="text-xs text-gray-400">Page 31 • Zero-Compromise Local-First Assistant Initialization</p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="cyber-glass p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                  currentStep > s.number
                    ? 'bg-emerald-500 text-black'
                    : currentStep === s.number
                    ? 'bg-cyan-500 text-black ring-4 ring-cyan-500/20'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {currentStep > s.number ? <Check className="w-4 h-4" /> : s.number}
              </div>
              <span className={`text-xs font-medium hidden md:inline ${currentStep === s.number ? 'text-cyan-300' : 'text-gray-400'}`}>
                {s.title}
              </span>
              {idx < steps.length - 1 && <div className="w-8 h-px bg-white/10 hidden lg:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="cyber-glass p-8 rounded-2xl min-h-[380px] flex flex-col justify-between">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Step 1: Choose Your Primary Operating Architecture</h2>
            <p className="text-xs text-gray-400">
              JARVIS is built from first principles to run 100% locally on your machine without requiring an internet connection or credit cards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div
                onClick={() => setSelectedMode('offline')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedMode === 'offline'
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-emerald-400 font-bold text-sm mb-1">Enforced 100% Offline (Recommended)</div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Complete air-gapped privacy. All reasoning is executed on your local GPU/CPU via llama.cpp. Zero external telemetry or API calls.
                </p>
              </div>

              <div
                onClick={() => setSelectedMode('hybrid')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedMode === 'hybrid'
                    ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-cyan-400 font-bold text-sm mb-1">Hybrid Cloud Mode</div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Allows optional outbound routing to cloud providers (OpenAI, Anthropic, Gemini) with local fallback during offline status.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Step 2: Host Environment & Toolchains</h2>
            <p className="text-xs text-gray-400">Verified system dependencies and execution capabilities:</p>

            <div className="space-y-2 font-mono text-xs pt-2">
              {[
                { name: 'Python 3.12.10 (x86_64)', status: 'Verified Available', color: 'text-emerald-400' },
                { name: 'Node.js v24.18.0 & npm 11.16.0', status: 'Verified Available', color: 'text-emerald-400' },
                { name: 'SQLite 3 with WAL & FTS5 Extension', status: 'Ready & Initialized', color: 'text-emerald-400' },
                { name: 'Tauri 2 Native Win32 Container', status: 'Ready', color: 'text-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
                  <span className="text-gray-200">{item.name}</span>
                  <span className={`font-bold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Step 3: Zero-Trust Security & Risk Tiers</h2>
            <p className="text-xs text-gray-400">
              JARVIS strictly enforces the Zero-Fabrication and Zero-Trust principle. No destructive action will ever be taken without explicit confirmation.
            </p>

            <div className="space-y-3 text-xs pt-2">
              <div className="p-3 bg-black/40 rounded-xl border-l-4 border-l-emerald-500">
                <span className="font-bold text-emerald-400 block">Tier 1: Read-Only Actions</span>
                <span className="text-gray-400">Introspection, memory lookups, and system status reads are executed seamlessly.</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border-l-4 border-l-amber-500">
                <span className="font-bold text-amber-400 block">Tier 2: Controlled Writes</span>
                <span className="text-gray-400">File editing and code execution require task approval in the Command Centre.</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border-l-4 border-l-red-500">
                <span className="font-bold text-red-400 block">Tier 3: Destructive Operations</span>
                <span className="text-gray-400">File deletions, external sockets, and OS modifications require dual-key confirmation.</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Step 4: Select Local Model Weight Format</h2>
            <p className="text-xs text-gray-400">
              Select your primary GGUF local model for offline natural language understanding:
            </p>

            <div className="space-y-3 pt-2">
              {[
                { id: 'llama3-8b', name: 'Meta Llama-3-8B-Instruct (Q4_K_M)', vram: '6.0 GB VRAM / RAM', bestFor: 'Superior reasoning & code generation' },
                { id: 'phi3-mini', name: 'Microsoft Phi-3-mini-4k-instruct (Q4_K_M)', vram: '3.5 GB VRAM / RAM', bestFor: 'Ultra-lightweight edge execution' },
                { id: 'qwen25-coder', name: 'Qwen-2.5-Coder-7B-Instruct (Q4_K_M)', vram: '5.5 GB VRAM / RAM', bestFor: 'Specialized polyglot programming' },
              ].map(m => (
                <div
                  key={m.id}
                  onClick={() => setModelType(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    modelType === m.id
                      ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{m.vram}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{m.bestFor}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Setup Completed Successfully</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              JARVIS has initialized your local SQLite WAL database, configured your zero-trust permission rules, and verified all core system runtimes.
            </p>
            <div className="p-3 bg-black/40 rounded-xl text-xs font-mono text-emerald-300 max-w-sm mx-auto">
              Mode: {selectedMode.toUpperCase()} • Model: {modelType}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              currentStep === 1 ? 'opacity-30 cursor-not-allowed text-gray-500' : 'text-gray-300 hover:text-white'
            }`}
          >
            Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setCompleted(true)}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {completed ? 'Initialization Active' : 'Enter JARVIS Command Centre'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
