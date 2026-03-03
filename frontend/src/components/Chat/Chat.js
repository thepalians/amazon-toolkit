import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadSessions(); loadTemplates(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = async () => {
    try { const res = await api.get('/chat/sessions'); setSessions(res.data.sessions || []); } catch { /* */ }
  };

  const loadTemplates = async () => {
    try { const res = await api.get('/chat/templates'); setTemplates(res.data.templates || []); } catch { /* */ }
  };

  const loadMessages = async (sessionId) => {
    try {
      const res = await api.get(`/chat/messages/${sessionId}`);
      setMessages(res.data.messages || []);
      setActiveSession(sessionId);
    } catch { /* */ }
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, created_at: new Date() }]);
    setLoading(true);

    try {
      const res = await api.post('/chat/send', { session_id: activeSession, message: msg });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, created_at: new Date() }]);
        if (!activeSession) {
          setActiveSession(res.data.session_id);
          loadSessions();
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (err.response?.data?.message || 'Failed to get response'), created_at: new Date() }]);
    }
    finally { setLoading(false); }
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setMessages([]);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      if (activeSession === id) { setActiveSession(null); setMessages([]); }
      loadSessions();
    } catch { /* */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Simple markdown rendering
  const renderContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
      .replace(/^### (.*$)/gm, '<h4 style="font-size:15px;font-weight:700;margin:10px 0 4px;">$1</h4>')
      .replace(/^## (.*$)/gm, '<h3 style="font-size:16px;font-weight:700;margin:12px 0 4px;">$1</h3>')
      .replace(/^- (.*$)/gm, '<div style="padding-left:12px;">• $1</div>')
      .replace(/^\d+\. (.*$)/gm, '<div style="padding-left:12px;">$&</div>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', margin: '-24px', overflow: 'hidden' }}>
      {/* Sessions Sidebar */}
      {showSidebar && (
        <div style={{ width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={handleNewChat}>
              + New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sessions.map(s => (
              <div key={s.id} style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                background: activeSession === s.id ? 'var(--accent-light)' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
                onClick={() => loadMessages(s.id)}
                onMouseEnter={(e) => { if (activeSession !== s.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (activeSession !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.session_title}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                    {s.total_messages} msgs
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            onClick={() => setShowSidebar(!showSidebar)}>☰</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🤖 AI Seller Assistant</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Powered by Claude</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Amazon Seller AI Assistant</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                Ask me anything about selling on Amazon — product research, listing optimization, PPC strategy, pricing, and more.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, maxWidth: 700, margin: '0 auto' }}>
                {templates.map((t, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                    onClick={() => handleSend(t.prompt)}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF9900'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
                      {t.prompt.substring(0, 60)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 16,
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {m.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 14,
                background: m.role === 'user' ? '#FF9900' : 'var(--card-bg)',
                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                border: m.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                fontSize: 14, lineHeight: 1.6,
              }}>
                {m.role === 'user' ? (
                  <div>{m.content}</div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
                )}
              </div>
              {m.role === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', flexShrink: 0, fontWeight: 700 }}>
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="dot-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9900', animation: 'pulse 1s infinite' }} />
                  <span className="dot-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9900', animation: 'pulse 1s infinite 0.2s' }} />
                  <span className="dot-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9900', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: 8, maxWidth: 800, margin: '0 auto' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Amazon selling..."
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color)',
                background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: 14,
                resize: 'none', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button className="btn btn-primary" onClick={() => handleSend()} disabled={loading || !input.trim()}
              style={{ borderRadius: 12, padding: '10px 20px' }}>
              {loading ? '...' : '➤'}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#6b7280', marginTop: 6 }}>
            Powered by Claude AI — Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
