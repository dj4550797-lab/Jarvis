import React, { useState } from 'react';
import { Eye, Monitor, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ScreenAwarenessPage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [redactionEnabled, setRedactionEnabled] = useState(true);
  const [ocrResult, setOcrResult] = useState<string>('Display 1 (2560x1440 @ 144Hz): Active window "Antigravity IDE - JARVIS PRD.md"');

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setOcrResult(`Display 1 (Primary): Captured frame at ${new Date().toLocaleTimeString()}. OCR extracted: "JARVIS Master Product Requirements Document - Part 5 Functional Specifications".`);
      setIsScanning(false);
    }, 700);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye color="var(--cyan-glow)" size={24} />
            Screen Awareness & Desktop Vision
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Local desktop screen capture, window inspection, and OCR-assisted UI automation.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Memory Buffers Only
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left: OCR Live Scanner Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Desktop OCR Telemetry</h3>
            <button onClick={handleScan} disabled={isScanning} className="cyber-button" style={{ padding: '6px 14px' }}>
              <RefreshCw size={14} />
              {isScanning ? 'Capturing...' : 'Capture & Inspect Screen'}
            </button>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <pre style={{ color: 'var(--cyan-glow)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
              {ocrResult}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span>Privacy Redaction: {redactionEnabled ? 'Enforced' : 'Off'}</span>
              <span>Memory Persistence: Discarded After Processing</span>
            </div>
          </div>
        </div>

        {/* Right: Screen Privacy Controls */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={18} color="var(--purple-glow)" />
            Vision Privacy Settings
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={redactionEnabled}
              onChange={(e) => setRedactionEnabled(e.target.checked)}
              style={{ accentColor: 'var(--cyan-glow)' }}
            />
            <span style={{ color: 'var(--text-primary)' }}>Mask Sensitive Password & Card Fields</span>
          </label>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <p>Per PRD Part 5 & 11, screen buffers are held strictly in temporary RAM and are never persisted to disk or sent to cloud services.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
