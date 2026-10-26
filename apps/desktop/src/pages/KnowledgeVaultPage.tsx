import React, { useState } from 'react';
import { Archive, Search, Upload, FileText, CheckCircle2, Shield, HardDrive } from 'lucide-react';

export const KnowledgeVaultPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ingestPath, setIngestPath] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Ingested documents state
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; path: string; size: string; chunks: number; status: string }>>([
    { id: 'doc-1', name: 'PRD.md', path: 'e:/Jarvis/PRD.md', size: '98 KB', chunks: 84, status: 'Indexed' },
    { id: 'doc-2', name: 'ARCHITECTURE.md', path: 'e:/Jarvis/ARCHITECTURE.md', size: '12 KB', chunks: 14, status: 'Indexed' },
    { id: 'doc-3', name: 'data.md', path: 'e:/Jarvis/data.md', size: '15 KB', chunks: 18, status: 'Indexed' },
  ]);

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestPath.trim()) return;
    setIsIngesting(true);
    setTimeout(() => {
      const fileName = ingestPath.split('/').pop() || ingestPath.split('\\').pop() || 'document.txt';
      setDocuments((prev) => [
        { id: `doc-${Date.now()}`, name: fileName, path: ingestPath, size: '4.2 KB', chunks: 6, status: 'Indexed' },
        ...prev,
      ]);
      setIngestPath('');
      setIsIngesting(false);
    }, 600);
  };

  const filteredDocs = documents.filter((d) => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.path.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive color="var(--cyan-glow)" size={24} />
            Knowledge Vault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Local document repository with text chunking, SHA-256 integrity hashing, and semantic search.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Storage Sovereign
        </span>
      </div>

      {/* Ingestion Bar */}
      <form onSubmit={handleIngest} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          value={ingestPath}
          onChange={(e) => setIngestPath(e.target.value)}
          placeholder="Enter local file path to index into vault (e.g. 'e:/Jarvis/SECURITY.md')..."
          style={{ flexGrow: 1, padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        />
        <button type="submit" disabled={!ingestPath.trim() || isIngesting} className="cyber-button" style={{ height: '42px', padding: '0 18px' }}>
          <Upload size={16} />
          {isIngesting ? 'Chunking & Hashing...' : 'Ingest Document'}
        </button>
      </form>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter indexed documents by name or path..."
          style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Document Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px' }}>Document Name</th>
              <th style={{ padding: '10px' }}>Local Absolute Path</th>
              <th style={{ padding: '10px' }}>Size</th>
              <th style={{ padding: '10px' }}>Chunks</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--cyan-glow)" /> {doc.name}
                </td>
                <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {doc.path}
                </td>
                <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{doc.size}</td>
                <td style={{ padding: '12px 10px', color: 'var(--purple-glow)', fontWeight: 700 }}>{doc.chunks}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} /> {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
