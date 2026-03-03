import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const TYPE_ICONS = { title: '📝', image: '🖼️', bullets: '📋', price: '💰', description: '📄' };
const STATUS_COLORS = { running: '#22c55e', completed: '#3b82f6', paused: '#f59e0b', draft: '#6b7280' };

export default function ABTest() {
  const [tests, setTests] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    asin: '', test_name: '', test_type: 'title', variant_a: '', variant_b: '', status: 'draft', notes: '',
  });
  const [metricsForm, setMetricsForm] = useState({});

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try { const res = await api.get('/abtest/list'); setTests(res.data.tests || []); } catch { /* */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/abtest/create', form);
      setShowAdd(false);
      setForm({ asin: '', test_name: '', test_type: 'title', variant_a: '', variant_b: '', status: 'draft', notes: '' });
      loadTests();
    } catch { /* */ }
  };

  const handleUpdateMetrics = async (id) => {
    try {
      await api.put(`/abtest/update/${id}`, metricsForm[id] || {});
      setEditId(null);
      loadTests();
    } catch { /* */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try { await api.delete(`/abtest/delete/${id}`); loadTests(); } catch { /* */ }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updates = { status };
      if (status === 'running' && !tests.find(t => t.id === id)?.start_date) updates.start_date = new Date();
      if (status === 'completed') updates.end_date = new Date();
      await api.put(`/abtest/update/${id}`, updates);
      loadTests();
    } catch { /* */ }
  };

  const initMetrics = (t) => {
    setMetricsForm({
      ...metricsForm,
      [t.id]: {
        variant_a_views: t.variant_a_views, variant_a_clicks: t.variant_a_clicks,
        variant_a_sales: t.variant_a_sales, variant_a_revenue: t.variant_a_revenue,
        variant_b_views: t.variant_b_views, variant_b_clicks: t.variant_b_clicks,
        variant_b_sales: t.variant_b_sales, variant_b_revenue: t.variant_b_revenue,
      },
    });
    setEditId(t.id);
  };

  const updateMetric = (testId, field, val) => {
    setMetricsForm({ ...metricsForm, [testId]: { ...metricsForm[testId], [field]: parseFloat(val) || 0 } });
  };

  const exportColumns = [
    { label: 'Test', accessor: 'test_name' },
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Type', accessor: 'test_type' },
    { label: 'Status', accessor: 'status' },
    { label: 'Winner', accessor: 'winner' },
    { label: 'Confidence', accessor: (r) => `${r.confidence}%` },
    { label: 'A Views', accessor: 'variant_a_views' },
    { label: 'A Sales', accessor: 'variant_a_sales' },
    { label: 'B Views', accessor: 'variant_b_views' },
    { label: 'B Sales', accessor: 'variant_b_sales' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🧪 A/B Test Manager</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Test titles, images, bullets and track which variant wins</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {tests.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(tests, exportColumns, 'ab-tests')}
              onPDF={() => exportToPDF(tests, exportColumns, 'ab-tests', 'A/B Test Results')}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ New Test'}</button>
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Create A/B Test</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">ASIN *</label>
                <input className="form-control" value={form.asin} onChange={(e) => setForm({...form, asin: e.target.value})} required /></div>
              <div className="form-group" style={{flex:2}}><label className="form-label">Test Name *</label>
                <input className="form-control" value={form.test_name} onChange={(e) => setForm({...form, test_name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Test Type</label>
                <select className="form-control" value={form.test_type} onChange={(e) => setForm({...form, test_type: e.target.value})}>
                  <option value="title">Title</option><option value="image">Main Image</option><option value="bullets">Bullet Points</option>
                  <option value="price">Price</option><option value="description">Description</option>
                </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Variant A (Current)</label>
                <textarea className="form-control" rows="3" value={form.variant_a} onChange={(e) => setForm({...form, variant_a: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Variant B (New)</label>
                <textarea className="form-control" rows="3" value={form.variant_b} onChange={(e) => setForm({...form, variant_b: e.target.value})} required /></div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Test</button>
          </form>
        </div>
      )}

      {tests.length > 0 ? tests.map(t => (
        <div key={t.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{TYPE_ICONS[t.test_type] || '🧪'}</span>
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>{t.test_name}</h4>
                <span style={{ fontFamily: 'monospace', color: '#FF9900', fontSize: 12 }}>{t.asin}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status] }}>{t.status}</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#f3f4f6' }}>{t.test_type}</span>
                {t.winner !== 'none' && <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a' }}>Winner: Variant {t.winner}</span>}
                {t.confidence > 0 && <span style={{ fontSize: 11, color: '#6b7280' }}>{t.confidence}% confidence</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {t.status === 'draft' && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleStatusChange(t.id, 'running')}>Start</button>}
              {t.status === 'running' && <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleStatusChange(t.id, 'completed')}>End</button>}
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => initMetrics(t)}>📊</button>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDelete(t.id)}>🗑️</button>
            </div>
          </div>

          {/* Variants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: t.winner === 'A' ? '#f0fdf4' : 'var(--bg-secondary)', border: t.winner === 'A' ? '2px solid #22c55e' : '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#3b82f6' }}>Variant A {t.winner === 'A' ? '🏆' : ''}</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{t.variant_a}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 8, fontSize: 11 }}>
                <div><span style={{ color: '#9ca3af' }}>Views:</span> <strong>{t.variant_a_views}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>Clicks:</span> <strong>{t.variant_a_clicks}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>Sales:</span> <strong>{t.variant_a_sales}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>CTR:</span> <strong>{t.stats?.aCTR}%</strong></div>
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: t.winner === 'B' ? '#f0fdf4' : 'var(--bg-secondary)', border: t.winner === 'B' ? '2px solid #22c55e' : '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#8b5cf6' }}>Variant B {t.winner === 'B' ? '🏆' : ''}</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{t.variant_b}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 8, fontSize: 11 }}>
                <div><span style={{ color: '#9ca3af' }}>Views:</span> <strong>{t.variant_b_views}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>Clicks:</span> <strong>{t.variant_b_clicks}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>Sales:</span> <strong>{t.variant_b_sales}</strong></div>
                <div><span style={{ color: '#9ca3af' }}>CTR:</span> <strong>{t.stats?.bCTR}%</strong></div>
              </div>
            </div>
          </div>

          {/* Edit Metrics */}
          {editId === t.id && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📊 Update Metrics</div>
              <div className="form-row">
                {['variant_a_views', 'variant_a_clicks', 'variant_a_sales', 'variant_a_revenue'].map(f => (
                  <div key={f} className="form-group">
                    <label className="form-label" style={{ fontSize: 10 }}>A {f.split('_')[2]}</label>
                    <input className="form-control" type="number" value={metricsForm[t.id]?.[f] || 0}
                      onChange={(e) => updateMetric(t.id, f, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="form-row">
                {['variant_b_views', 'variant_b_clicks', 'variant_b_sales', 'variant_b_revenue'].map(f => (
                  <div key={f} className="form-group">
                    <label className="form-label" style={{ fontSize: 10 }}>B {f.split('_')[2]}</label>
                    <input className="form-control" type="number" value={metricsForm[t.id]?.[f] || 0}
                      onChange={(e) => updateMetric(t.id, f, e.target.value)} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => handleUpdateMetrics(t.id)}>Save Metrics</button>
            </div>
          )}
        </div>
      )) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🧪</p>
          <p style={{ color: '#6b7280' }}>No A/B tests yet — create one to start testing</p>
        </div>
      )}
    </div>
  );
}
