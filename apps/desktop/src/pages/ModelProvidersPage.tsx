import React, { useEffect, useState } from 'react';
import { Cpu, Radio, Shield, Download, CheckCircle2, AlertTriangle, HardDrive } from 'lucide-react';
import { fetchProviders, fetchLocalModels } from '../services/api';

export const ModelProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [localModels, setLocalModels] = useState<any[]>([]);
  const [offlineEnforced, setOfflineEnforced] = useState(true);

  useEffect(() => {
    fetchProviders().then(setProviders).catch(console.warn);
    fetchLocalModels().then(setLocalModels).catch(console.warn);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu color="var(--cyan-glow)" size={24} />
            Models & API Providers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Local GGUF/llama.cpp inference engine, on-device model discovery, and optional cloud providers.
          </p>
        </div>
        <span className={offlineEnforced ? 'badge badge-offline' : 'badge badge-online'}>
          <Shield size={12} />
          {offlineEnforced ? 'Zero-API Mode Enforced' : 'Online / Hybrid Active'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Local GGUF Engine */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Discovered Local Models</h3>
            <span className="badge badge-offline">llama.cpp Engine</span>
          </div>

          {localModels.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              <HardDrive size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>No model weights currently in <code>./models</code>.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Download a compatible GGUF model (e.g. Llama-3.2-3B-Instruct.Q4_K_M.gguf) into the models folder.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {localModels.map((m, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'rgba(7, 10, 19, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--cyan-glow)' }}>{m.filename}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>{m.size_mb} MB</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Runtime: {m.runtime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configured Providers Registry */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Configured Provider Registry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {providers.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.name}</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type: {p.provider_type}</p>
                </div>
                <span className={`badge ${p.is_local ? 'badge-offline' : 'badge-online'}`} style={{ fontSize: '0.7rem' }}>
                  {p.is_local ? 'Local Offline' : 'Cloud API'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
