import React, { useState } from 'react';
import { GitBranch, Search, Sparkles, Shield, Eye, Layers } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'file' | 'task';
  connections: string[];
}

export const KnowledgeGraphPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('node-1');
  const [search, setSearch] = useState('');

  const nodes: GraphNode[] = [
    { id: 'node-1', label: 'Local SQLite WAL', type: 'entity', connections: ['FTS5 Full-Text', 'Memories Table', 'Task Leases'] },
    { id: 'node-2', label: 'FTS5 Full-Text', type: 'concept', connections: ['Local SQLite WAL', 'Contextual Memory'] },
    { id: 'node-3', label: 'Llama-3.2-3B GGUF', type: 'entity', connections: ['Offline Speech', 'Task Planner', 'Local Inference'] },
    { id: 'node-4', label: 'Universal Command Centre', type: 'task', connections: ['Task Planner', 'Risk Classification'] },
    { id: 'node-5', label: 'Knowledge Vault', type: 'file', connections: ['PRD.md', 'ARCHITECTURE.md', 'data.md'] },
    { id: 'node-6', label: 'Android Sync Lease', type: 'concept', connections: ['Cross-Device Handoff', 'Local SQLite WAL'] },
  ];

  const filteredNodes = nodes.filter((n) => !search || n.label.toLowerCase().includes(search.toLowerCase()));
  const activeNode = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch color="var(--purple-glow)" size={24} />
            Project Memory & Knowledge Graph
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Topological association network linking memories, documents, tasks, and system entities.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Association Matrix
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Graph Visual Canvas */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Semantic Association Topology</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge" style={{ fontSize: '0.7rem' }}>Entities: 12</span>
              <span className="badge" style={{ fontSize: '0.7rem' }}>Edges: 28</span>
            </div>
          </div>

          {/* Interactive Node Matrix */}
          <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center', padding: '20px' }}>
            {filteredNodes.map((node) => {
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    background: isSelected ? 'var(--bg-elevated)' : 'rgba(7, 10, 19, 0.5)',
                    border: `1px solid ${isSelected ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                    boxShadow: isSelected ? '0 0 16px var(--cyan-glow-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.65rem',
                      marginBottom: '8px',
                      background: node.type === 'entity' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: node.type === 'entity' ? 'var(--cyan-glow)' : 'var(--purple-glow)',
                    }}
                  >
                    {node.type.toUpperCase()}
                  </span>
                  <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>{node.label}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    {node.connections.length} linked edges
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspection Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Entity</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyan-glow)', marginTop: '2px' }}>
              {activeNode.label}
            </h3>
          </div>

          <div>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Connected Associations:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeNode.connections.map((c, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(7, 10, 19, 0.5)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--purple-glow)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Cluster Density:</span>
              <strong style={{ color: 'var(--text-primary)' }}>High (0.84)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Memory Persistence:</span>
              <strong style={{ color: 'var(--emerald)' }}>Verified ACID</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
