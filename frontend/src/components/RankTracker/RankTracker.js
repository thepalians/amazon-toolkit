import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function RankTrackerUI() {
  const { countryCode, countries, changeCountry } = useCountry();
  const [trackers, setTrackers] = useState([]);
  const [summary, setSummary] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [checking, setChecking] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ asin: '', keyword: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTrackers(); }, []);

  const loadTrackers = async () => {
    try {
      const res = await api.get('/rank-tracker/list');
      setTrackers(res.data.trackers || []);
      setSummary(res.data.summary || {});
    } catch { /* */ }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rank-tracker/add', { ...form, country_code: countryCode });
      setShowAdd(false); setForm({ asin: '', keyword: '' }); loadTrackers();
    } catch { /* */ }
  };

  const handleCheck = async (id) => {
    setChecking(id);
    try { await api.post(`/rank-tracker/check/${id}`); loadTrackers(); } catch { /* */ }
    finally { setChecking(null); }
  };

  const loadHistory = async (id) => {
    if (historyId === id) { setHistoryId(null); return; }
    try {
      const res = await api.get(`/rank-tracker/history/${id}`);
      setHistory(res.data.history || []);
      setHistoryId(id);
    } catch { /* */ }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/rank-tracker/delete/${id}`); loadTrackers(); } catch { /* */ }
  };

  const getRankChange = (current, previous) => {
    if (!previous || !current) return { text: '—', color: '#6b7280' };
    const diff = previous - current;
    if (diff > 0) return { text: `+${diff}`, color: '#22c55e', icon: '↑' };
    if (diff < 0) return { text: `${diff}`, color: '#ef4444', icon: '↓' };
    return { text: '0', color: '#6b7280', icon: '—' };
  };

  const exportColumns = [
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Keyword', accessor: 'keyword' },
    { label: 'Rank', accessor: 'current_rank' },
    { label: 'Best', accessor: 'best_rank' },
    { label: 'Change', accessor: (r) => r.previous_rank ? r.previous_rank - r.current_rank : 'N/A' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📍 Keyword Rank Tracker</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Track your product rankings for target keywords</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {trackers.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(trackers, exportColumns, 'rank-tracker')}
              onPDF={() => exportToPDF(trackers, exportColumns, 'rank-tracker', 'Keyword Rank Report')}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Track Keyword'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tracking', value: summary.total || 0, color: '#3b82f6', icon: '📍' },
          { label: 'Page 1', value: summary.page1 || 0, color: '#22c55e', icon: '🏆' },
          { label: 'Improved', value: summary.improved || 0, color: '#22c55e', icon: '📈' },
          { label: 'Dropped', value: summary.dropped || 0, color: '#ef4444', icon: '📉' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marketplace</label>
                <select className="form-control" value={countryCode} onChange={(e) => changeCountry(e.target.value)}>
                  {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">ASIN</label>
                <input className="form-control" value={form.asin} onChange={(e) => setForm({...form, asin: e.target.value})} placeholder="B0BSHF7WHW" required /></div>
              <div className="form-group" style={{flex:2}}><label className="form-label">Keyword</label>
                <input className="form-control" value={form.keyword} onChange={(e) => setForm({...form, keyword: e.target.value})} placeholder="wireless earbuds" required /></div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" type="submit">Track</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {trackers.length > 0 ? (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ASIN</th><th>Keyword</th><th>Rank</th><th>Change</th><th>Best</th><th>Last Checked</th><th>Actions</th></tr></thead>
              <tbody>
                {trackers.map(t => {
                  const change = getRankChange(t.current_rank, t.previous_rank);
                  return (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td style={{ fontFamily: 'monospace', color: '#FF9900', fontWeight: 700 }}>{t.asin}</td>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{t.keyword}</td>
                        <td style={{ fontWeight: 800, fontSize: 18, color: t.current_rank > 0 && t.current_rank <= 48 ? '#22c55e' : t.current_rank > 0 ? '#f59e0b' : '#6b7280' }}>
                          {t.current_rank > 0 ? `#${t.current_rank}` : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: change.color }}>{change.icon} {change.text}</td>
                        <td style={{ color: '#22c55e', fontWeight: 600 }}>{t.best_rank > 0 ? `#${t.best_rank}` : '—'}</td>
                        <td style={{ fontSize: 11, color: '#6b7280' }}>{t.last_checked ? new Date(t.last_checked).toLocaleString() : 'Never'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-primary" style={{ padding: '3px 8px', fontSize: 10 }}
                              onClick={() => handleCheck(t.id)} disabled={checking === t.id}>
                              {checking === t.id ? '...' : '🔍 Check'}
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }}
                              onClick={() => loadHistory(t.id)}>📊</button>
                            <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10 }}
                              onClick={() => handleDelete(t.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                      {historyId === t.id && history.length > 0 && (
                        <tr><td colSpan="7" style={{ padding: 0 }}>
                          <div style={{ padding: 16, background: 'var(--bg-secondary)' }}>
                            <ResponsiveContainer width="100%" height={150}>
                              <LineChart data={[...history].reverse().map(h => ({ date: new Date(h.checked_at).toLocaleDateString(), rank: h.rank_position }))}>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis reversed tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="rank" stroke="#FF9900" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>📍</p>
          <p style={{ color: '#6b7280' }}>No keywords being tracked — add your first one</p>
        </div>
      )}
    </div>
  );
}
