import React, { useState } from 'react';
import { Smartphone, Monitor, Share2, Wifi, CheckCircle2, RefreshCw, ArrowRight, Lock } from 'lucide-react';

interface DevicePair {
  id: string;
  name: string;
  platform: 'Android' | 'Windows';
  ipAddress: string;
  status: 'paired' | 'active_lease' | 'offline';
  lastSeen: string;
}

export const CrossDeviceHandoffPage: React.FC = () => {
  const [syncClipboard, setSyncClipboard] = useState<boolean>(true);
  const [forwardNotifications, setForwardNotifications] = useState<boolean>(true);
  const [devices, setDevices] = useState<DevicePair[]>([
    { id: 'dev_android_01', name: 'Pixel 8 Pro (Companion)', platform: 'Android', ipAddress: '192.168.1.142', status: 'paired', lastSeen: 'Just now' },
    { id: 'dev_win_local', name: 'Master Workstation (This Host)', platform: 'Windows', ipAddress: '127.0.0.1', status: 'active_lease', lastSeen: 'Active' },
  ]);
  const [handoffMsg, setHandoffMsg] = useState<string | null>(null);

  const triggerHandoff = (targetName: string) => {
    setHandoffMsg(`Transferring active context and conversational lease to ${targetName}...`);
    setTimeout(() => {
      setHandoffMsg(`Handoff completed: Session lease transferred cryptographically to ${targetName} via LAN TLS.`);
      setTimeout(() => setHandoffMsg(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Cross-Device Handoff & Mobility Hub</h1>
            <p className="text-xs text-gray-400">Page 29 • Real-Time Task Lease Migration (Windows ↔ Android Companion)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            mDNS LAN Discovery Active
          </span>
        </div>
      </div>

      {handoffMsg && (
        <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 font-mono animate-fadeIn">
          {handoffMsg}
        </div>
      )}

      {/* Device Architecture Diagram */}
      <div className="cyber-glass p-6 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Windows Workstation</div>
            <div className="text-[11px] text-gray-400 font-mono">Core Backend & High-VRAM GGUF</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
            <span>Encrypted Local Socket</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
          <button
            onClick={() => triggerHandoff('Pixel 8 Pro (Companion)')}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
          >
            Migrate Active Task Lease
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Android Mobile Companion</div>
            <div className="text-[11px] text-gray-400 font-mono">Sensors, Audio Mic, Push Alerts</div>
          </div>
        </div>
      </div>

      {/* Paired Device List */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          Registered Local Network Nodes
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyan-500/20 text-gray-400 uppercase text-[10px] tracking-wider font-mono">
                <th className="py-2.5 px-3">Device Identity</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Local IP</th>
                <th className="py-2.5 px-3">Last Heartbeat</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-white/5">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans flex items-center gap-2">
                    {d.platform === 'Android' ? <Smartphone className="w-4 h-4 text-purple-400" /> : <Monitor className="w-4 h-4 text-cyan-400" />}
                    {d.name}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300">{d.platform}</td>
                  <td className="py-2.5 px-3 text-gray-300">{d.ipAddress}</td>
                  <td className="py-2.5 px-3 text-gray-400">{d.lastSeen}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'active_lease' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {d.status === 'active_lease' ? 'ACTIVE LEASE' : 'CONNECTED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synchronization Preferences */}
      <div className="cyber-glass p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold text-gray-200">Continuous Handoff Services</h2>
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
            <div>
              <div className="font-semibold text-white">Bi-Directional Encrypted Clipboard Sync</div>
              <div className="text-gray-400 text-[11px]">Copying text or image on Windows automatically prepares it on Android pasteboard.</div>
            </div>
            <button
              onClick={() => setSyncClipboard(!syncClipboard)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${syncClipboard ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-gray-800 text-gray-400'}`}
            >
              {syncClipboard ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
            <div>
              <div className="font-semibold text-white">Mobile Push Notification Forwarder</div>
              <div className="text-gray-400 text-[11px]">Deliver approval requests and long-running job completion notifications to Android.</div>
            </div>
            <button
              onClick={() => setForwardNotifications(!forwardNotifications)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${forwardNotifications ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-gray-800 text-gray-400'}`}
            >
              {forwardNotifications ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
