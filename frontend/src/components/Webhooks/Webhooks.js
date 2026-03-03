import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PLATFORM_ICONS = { slack: '💬', discord: '🎮', teams: '👥', custom: '🔗' };
const PLATFORM_COLORS = { slack: '#4a154b', discord: '#5865f2', teams: '#6264a7', custom: '#6b7280' };

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [logs, setLogs] = useState({});
  const [showLogsId, setShowLogsId] = useState(null);
  const [testing, setTesting] = useState(null);
  const [form, setForm] = useState({
    webhook_name: '', webhook_url: '', platform: 'discord', events: [],
  });

  useEffect(() => { loadWebhooks(); }, []);

  const loadWebhooks = async () => {
    try {
      const res = await api.get('/webhooks/list');
      setWebhooks(res.data.webhooks || []);
      setAvailableEvents(res.data.availableEvents || []);
    } catch { /* */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/webhooks/create', form);
      setShowAdd(false);
      setForm({ webhook_name: '', webhook_url: '', platform: 'discord', events: [] });
      loadWebhooks();
    } catch { /* */ }
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      const res = await api.post(`/webhooks/test/${id}`);
      alert(res.data.success ? 'Test sent' : `Failed: ${res.data.message}`);
    } catch (err) {
      alert('Test failed');
    }
    finally { setTesting(null); }
  };

  const handleToggle = async (id, isActive) => {
    try { await api.put(`/webhooks/update/${id}`, { is_active: !isActive }); loadWebhooks(); } catch { /* */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete webhook?')) return;
    try { await api.delete(`/webhooks/delete/${id}`); loadWebhooks(); } catch { /* */ }
  };

  const loadLogs = async (id) => {
    if (showLogsId === id) { setShowLogsId(null); return; }
    try {
      const res = await api.get(`/webhooks/logs/${id}`);
      setLogs({ ...logs, [id]: res.data.logs || [] });
      setShowLogsId(id);
    } catch { /* */ }
  };

  const toggleEvent = (event) => {
    const current = form.events || [];
    setForm({
      ...form,
      events: current.includes(event) ? current.filter(e => e !== event) : [...current, event],
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔗 Webhook Integrations</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Send alerts to Slack, Discord, Teams or any webhook URL</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ Add Webhook'}</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Add Webhook</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Name *</label>
                <input className="form-control" value={form.webhook_name} onChange={(e) => setForm({...form, webhook_name: e.target.value})} placeholder="My Slack Alert" required /></div>
              <div className="form-group"><label className="form-label">Platform</label>
                <select className="form-control" value={form.platform} onChange={(e) => setForm({...form, platform: e.target.value})}>
                  <option value="slack">Slack</option><option value="discord">Discord</option>
                  <option value="teams">MS Teams</option><option value="custom">Custom</option>
                </select></div>
            </div>
            <div className="form-group"><label className="form-label">Webhook URL *</label>
              <input className="form-control" value={form.webhook_url} onChange={(e) => setForm({...form, webhook_url: e.target.value})} placeholder="https://hooks.slack.com/..." required /></div>
            <div className="form-group">
              <label className="form-label">Events (empty = all events)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {availableEvents.map(ev => (
                  <button key={ev} type="button" style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 11, border: '1px solid var(--border-color)',
                    cursor: 'pointer', fontWeight: 500,
                    background: (form.events || []).includes(ev) ? '#FF9900' : 'var(--bg-secondary)',
                    color: (form.events || []).includes(ev) ? '#fff' : 'var(--text-secondary)',
                  }} onClick={() => toggleEvent(ev)}>{ev}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Add Webhook</button>
          </form>
        </div>
      )}

      {webhooks.length > 0 ? webhooks.map(w => (
        <div key={w.id} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{PLATFORM_ICONS[w.platform]}</span>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>{w.webhook_name}</h4>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: '#6b7280' }}>
                  <span style={{ padding: '1px 6px', borderRadius: 8, background: `${PLATFORM_COLORS[w.platform]}20`, color: PLATFORM_COLORS[w.platform], fontWeight: 600 }}>{w.platform}</span>
                  <span style={{ color: w.is_active ? '#22c55e' : '#ef4444' }}>{w.is_active ? '● Active' : '● Inactive'}</span>
                  <span>Sent: {w.total_sent}</span>
                  {w.total_failed > 0 && <span style={{ color: '#ef4444' }}>Failed: {w.total_failed}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleTest(w.id)} disabled={testing === w.id}>
                {testing === w.id ? '...' : '🧪 Test'}
              </button>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => loadLogs(w.id)}>📋 Logs</button>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleToggle(w.id, w.is_active)}>{w.is_active ? '⏸️' : '▶️'}</button>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleDelete(w.id)}>🗑️</button>
            </div>
          </div>

          {showLogsId === w.id && (logs[w.id] || []).length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Recent Logs</div>
              {(logs[w.id] || []).slice(0, 10).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid var(--border-color)' }}>
                  <span>{l.success ? '✅' : '❌'} {l.event_type}</span>
                  <span style={{ color: '#9ca3af' }}>{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🔗</p>
          <p style={{ color: '#6b7280' }}>No webhooks yet — connect Slack, Discord or custom endpoints</p>
        </div>
      )}
    </div>
  );
}
