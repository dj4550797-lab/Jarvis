import React, { useEffect, useState } from 'react';
import { MemoryItem } from '../types';
import { fetchMemories } from '../services/api';
import { BookOpen, Search, Plus, Trash2, Shield, Sparkles } from 'lucide-react';

export const ContextualMemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'user' | 'system' | 'coding' | 'personal' | 'device'>('user');
  const [isAdding, setIsAdding] = useState(false);

  const loadMemories = async () => {
    try {
      const data = await fetchMemories(50);
      setMemories(data);
    } catch (err) {
      console.warn('Failed to fetch memories:', err);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/v1/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          memory_type: 'fact',
          importance: 1.0,
        }),
      });
      if (res.ok) {
        setNewContent('');
        await loadMemories();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/v1/memories/${id}`, { method: 'DELETE' });
      await loadMemories();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesQuery = !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen color="var(--purple-glow)" size={24} />
            Contextual Memory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Persistent cognitive facts, user preferences, and episodic memories indexed via SQLite FTS5.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          SQLite FTS5 Local Index
        </span>
      </div>

      {/* Add Memory Panel */}
      <form onSubmit={handleAddMemory} className="glass-panel" style={{ padding: '18px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Record a new persistent fact or preference (e.g. 'Prefers dark cyber theme and local models')..."
          style={{ flexGrow: 1, padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as any)}
          style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
        >
          <option value="user">User</option>
          <option value="system">System</option>
          <option value="coding">Coding</option>
          <option value="personal">Personal</option>
          <option value="device">Device</option>
        </select>
        <button type="submit" disabled={!newContent.trim() || isAdding} className="cyber-button" style={{ height: '42px', padding: '0 18px' }}>
          <Plus size={16} /> Save Fact
        </button>
      </form>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contextual memory using SQLite FTS5..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'user', 'system', 'coding', 'personal', 'device'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? 'var(--cyan-glow-subtle)' : 'transparent',
                border: `1px solid ${categoryFilter === cat ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                color: categoryFilter === cat ? 'var(--cyan-glow)' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredMemories.map((m) => (
          <div key={m.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px', textTransform: 'uppercase' }}>
                {m.category}
              </span>
              <button
                onClick={() => handleDelete(m.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Delete memory record"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4, flexGrow: 1 }}>{m.content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span>Hits: {m.access_count}</span>
              <span>Updated: {new Date(m.last_accessed_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
