import React from 'react';
import { Cpu, Shield, Database, CheckCircle2 } from 'lucide-react';

export const ModelEvolutionPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu color="var(--purple-glow)" size={24} />
            Model Evolution Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Domain adaptation dataset curator, LoRA weight fine-tuning manager, and weights quantization exporter.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Dataset Storage
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Curated Training Datasets</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Personal datasets compiled from verified Knowledge Vault facts for on-device GGUF quantization fine-tuning.
        </p>
        <div style={{ padding: '16px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: 'var(--cyan-glow)' }}>Personal Memory Dataset v1</strong>
            <span className="badge badge-success">Exported (JSONL)</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>42 Instruction-Response Pairs • 100% Privacy Redacted</span>
        </div>
      </div>
    </div>
  );
};
