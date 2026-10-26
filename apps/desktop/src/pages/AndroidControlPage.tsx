import React, { useState } from 'react';
import { Smartphone, Shield, Radio, CheckCircle2, RefreshCw } from 'lucide-react';

export const AndroidControlPage: React.FC = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastSync, setLastSync] = useState('Never (Pairing Ready)');

  const handlePair = () => {
    setDeviceConnected(true);
    setLastSync(new Date().toLocaleTimeString());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone color="var(--emerald)" size={24} />
            Android App & Device Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Direct bridge with the single-file JARVIS.apk companion app running Jetpack Compose.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Loopback / mDNS Sync
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Device Status Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Companion Device Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: deviceConnected ? 'var(--emerald)' : 'var(--amber)' }} />
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {deviceConnected ? 'Android Companion Active (JARVIS.apk)' : 'Awaiting Local Mobile Connection'}
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Last Synchronization: {lastSync}
              </p>
            </div>
          </div>

          <button onClick={handlePair} className="cyber-button" style={{ alignSelf: 'flex-start' }}>
            <RefreshCw size={14} />
            {deviceConnected ? 'Re-sync Device State' : 'Pair Companion Device'}
          </button>
        </div>

        {/* APK Architecture & Requirements */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Single APK Specifications</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--emerald)" /> Universal single APK target: <code>JARVIS.apk</code>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--emerald)" /> Native Kotlin + Jetpack Compose UI
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--emerald)" /> Zero separate Python or Node runtime on phone
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--emerald)" /> Encrypted room persistence for offline task history
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
