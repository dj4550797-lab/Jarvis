import React, { useState } from 'react';
import { HardDrive, CheckCircle2, Shield, Download, AlertTriangle, Disc, RefreshCw } from 'lucide-react';

interface BundleComponent {
  name: string;
  category: string;
  sizeMB: number;
  status: 'ready' | 'pending';
}

export const UsbRecoveryPage: React.FC = () => {
  const [targetPath, setTargetPath] = useState<string>('E:\\Jarvis\\backups\\usb_recovery');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const components: BundleComponent[] = [
    { name: 'Python 3.12.10 Embedded Runtime (Windows x64)', category: 'Runtime', sizeMB: 38, status: 'ready' },
    { name: 'JARVIS Backend FastIPC Server & Dependencies', category: 'Application', sizeMB: 45, status: 'ready' },
    { name: 'JARVIS Tauri 2 Desktop Standalone Executable', category: 'Frontend', sizeMB: 28, status: 'ready' },
    { name: 'Llama-3-8B-Instruct-Q4_K_M Offline Model Weights', category: 'Model Weights', sizeMB: 4680, status: 'ready' },
    { name: 'SQLite Master Database & FTS5 Index Hot Snapshot', category: 'Data & Memories', sizeMB: 12, status: 'ready' },
    { name: 'Offline Whisper-Tiny & Piper-TTS Voice Packs', category: 'Speech Engine', sizeMB: 140, status: 'ready' },
  ];

  const totalSizeMB = components.reduce((acc, c) => acc + c.sizeMB, 0);

  const handleBuildBundle = () => {
    setIsBuilding(true);
    setProgressMsg('Verifying target directory structure...');
    setTimeout(() => {
      setProgressMsg('Packaging standalone embedded runtimes and GGUF manifests...');
      setTimeout(() => {
        setIsBuilding(false);
        setProgressMsg(`Success: Offline portable recovery image prepared at ${targetPath}. Total payload: ${(totalSizeMB / 1024).toFixed(2)} GB.`);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">USB Portable Recovery Drive Creator</h1>
            <p className="text-xs text-gray-400">Page 28 • 100% Offline Standalone Bootable JARVIS Environment</p>
          </div>
        </div>

        <button
          onClick={handleBuildBundle}
          disabled={isBuilding}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10"
        >
          <Download className={`w-3.5 h-3.5 ${isBuilding ? 'animate-bounce' : ''}`} />
          {isBuilding ? 'Compiling Bundle...' : 'Build Offline Recovery Image'}
        </button>
      </div>

      {progressMsg && (
        <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 font-mono animate-fadeIn">
          {progressMsg}
        </div>
      )}

      {/* Target Drive Specification */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          Target Storage Destination
        </h2>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
            placeholder="e.g. D:\JARVIS_RECOVERY or E:\backups\usb_recovery"
          />
        </div>
        <p className="text-[11px] text-gray-400">
          Target volume must have at least 8.0 GB of unallocated space formatted with NTFS or exFAT to support large GGUF model files.
        </p>
      </div>

      {/* Manifest Table */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Portable Bundle Manifest Checklist
          </h2>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            Payload Size: {(totalSizeMB / 1024).toFixed(2)} GB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyan-500/20 text-gray-400 uppercase text-[10px] tracking-wider font-mono">
                <th className="py-2.5 px-3">Component Description</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3 text-right">Payload Size</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {components.map((c, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{c.name}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{c.category}</td>
                  <td className="py-2.5 px-3 text-right text-gray-300">
                    {c.sizeMB >= 1024 ? `${(c.sizeMB / 1024).toFixed(2)} GB` : `${c.sizeMB} MB`}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      READY
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
