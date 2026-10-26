import React, { useState } from 'react';
import { MessageSquare, Send, Shield, Clock, CheckCircle2 } from 'lucide-react';

export const MessagingAutomationPage: React.FC = () => {
  const [recipient, setRecipient] = useState('administrator@jarvis.local');
  const [message, setMessage] = useState('System health report: All unit test suites passed with 100% success rate.');
  const [outbox, setOutbox] = useState<Array<{ id: string; to: string; msg: string; time: string; status: string }>>([
    { id: 'msg-1', to: 'administrator@jarvis.local', msg: 'Phase 1 Scaffolding complete and committed to GitHub.', time: '20:58', status: 'Delivered' },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setOutbox((prev) => [
      { id: `msg-${Date.now()}`, to: recipient, msg: message, time: new Date().toLocaleTimeString(), status: 'Delivered' },
      ...prev,
    ]);
    setMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare color="var(--purple-glow)" size={24} />
            Communication & Messaging Automation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Outbound notification engine, scheduled system briefs, and local notification triggers.
          </p>
        </div>
        <span className="badge badge-offline">
          <Shield size={12} />
          Local Notifications
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Compose Form */}
        <form onSubmit={handleSend} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Compose Automated Dispatch</h3>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Recipient Identity</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Message Body</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>
          <button type="submit" disabled={!message.trim()} className="cyber-button" style={{ alignSelf: 'flex-start' }}>
            <Send size={16} /> Dispatch Message
          </button>
        </form>

        {/* Outbox Log */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Outbox Dispatch Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {outbox.map((o) => (
              <div key={o.id} style={{ padding: '12px 14px', background: 'rgba(7, 10, 19, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--cyan-glow)', fontWeight: 600 }}>{o.to}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{o.time}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
