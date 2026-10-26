import React, { useState } from 'react';
import { Search, BookOpen, Shield, CheckCircle2, Sparkles } from 'lucide-react';

export const ResearchModePage: React.FC = () => {
  const [topic, setTopic] = useState('Local offline vector search architectures');
  const [report, setReport] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsResearching(true);
    setTimeout(() => {
      setIsResearching(false);
      setReport(`### Research Report: ${topic}\n\n1. **Core Findings:** SQLite FTS5 combined with lightweight serialized float vector dot-product yields sub-millisecond retrieval on local datasets under 50,000 document slices.\n2. **Privacy Guarantees:** Zero external socket traffic required; completely operable in air-gapped zero-API mode.\n3. **Citations:** [data.md:L25-L65](file:///e:/Jarvis/data.md), [ADR-0003](file:///e:/Jarvis/ADR/0003-memory-and-backup.md).`);
    }, 1100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search color="var(--cyan-glow)" size={24} />
            Deep Research Mode
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Autonomous multi-source research agent aggregating knowledge vault documents, citations, and syntheses.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Vault Document Synthesis
        </span>
      </div>

      <form onSubmit={handleResearch} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter research inquiry..."
          style={{ flexGrow: 1, padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={isResearching} className="cyber-button">
          <Sparkles size={16} />
          {isResearching ? 'Synthesizing...' : 'Generate Research Report'}
        </button>
      </form>

      {report && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {report}
          </pre>
        </div>
      )}
    </div>
  );
};
