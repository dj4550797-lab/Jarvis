import React from 'react';
import { Cpu, Shield, Award, Clock } from 'lucide-react';

export const ModelEvaluationPage: React.FC = () => {
  const benchmarks = [
    { model: 'Llama-3.2-3B-Instruct.Q4_K_M', tokensPerSec: '42.6 t/s', ramUsage: '2.4 GB', latency: '24ms', rating: '94/100' },
    { model: 'Llama-3.2-1B-Instruct.Q8_0', tokensPerSec: '88.1 t/s', ramUsage: '1.2 GB', latency: '12ms', rating: '88/100' },
    { model: 'Mistral-7B-Instruct-v0.3.Q4_K_M', tokensPerSec: '21.4 t/s', ramUsage: '4.8 GB', latency: '48ms', rating: '96/100' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award color="var(--purple-glow)" size={24} />
            Model Evaluation Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Offline benchmark testing, inference latency telemetry, and model quantization comparisons.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Hardware Profiler
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Local Quantization Benchmarks</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px' }}>Model & Quantization</th>
              <th style={{ padding: '10px' }}>Speed</th>
              <th style={{ padding: '10px' }}>RAM Footprint</th>
              <th style={{ padding: '10px' }}>First Token Latency</th>
              <th style={{ padding: '10px' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>{b.model}</td>
                <td style={{ padding: '12px 10px', color: 'var(--cyan-glow)', fontWeight: 700 }}>{b.tokensPerSec}</td>
                <td style={{ padding: '12px 10px', color: 'var(--emerald)' }}>{b.ramUsage}</td>
                <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{b.latency}</td>
                <td style={{ padding: '12px 10px', color: 'var(--purple-glow)', fontWeight: 700 }}>{b.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
