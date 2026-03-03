import React, { useEffect, useState, useCallback } from 'react';
import adminApi from '../../services/adminApi';

const PLAN_OPTIONS = ['starter', 'professional', 'enterprise'];

export default function KeyManagement() {
  const [keys, setKeys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [filters, setFilters] = useState({ batch_id: '', plan_type: '', is_used: '' });
  const [form, setForm] = useState({ planType: 'starter', durationMonths: 12, quantity: 10, batchId: '' });
  const [generating, setGenerating] = useState(false);
  const [newKeys, setNewKeys] = useState([]);
  const [genMsg, setGenMsg] = useState('');
  const [genError, setGenError] = useState('');

  const [stats, setStats] = useState({ total: 0, used: 0, available: 0 });

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filters.batch_id) params.batch_id = filters.batch_id;
      if (filters.plan_type) params.plan_type = filters.plan_type;
      if (filters.is_used !== '') params.is_used = filters.is_used;
      const res = await adminApi.get('/admin/keys', { params });
      setKeys(res.data.keys || []);
      setTotal(res.data.total || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, usedRes] = await Promise.all([
        adminApi.get('/admin/keys', { params: { limit: 1 } }),
        adminApi.get('/admin/keys', { params: { limit: 1, is_used: 1 } }),
      ]);
      const totalCount = allRes.data.total || 0;
      const usedCount = usedRes.data.total || 0;
      setStats({ total: totalCount, used: usedCount, available: totalCount - usedCount });
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenMsg('');
    setGenError('');
    setNewKeys([]);
    try {
      const res = await adminApi.post('/admin/keys/generate', form);
      setNewKeys(res.data.keys || []);
      setGenMsg(`Generated ${res.data.keys?.length} key(s) successfully.`);
      fetchKeys();
      fetchStats();
    } catch (err) {
      setGenError(err.response?.data?.message || 'Failed to generate keys.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (batchId) => {
    const token = localStorage.getItem('adminToken');
    const baseUrl = process.env.REACT_APP_API_URL || '/api';
    window.open(`${baseUrl}/admin/keys/export/${encodeURIComponent(batchId)}?token=${token}`, '_blank');
  };

  const statusColor = { used: '#ef4444', available: '#22c55e' };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Activation Key Management</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
        Manage Amazon key card activation codes for physical card distribution.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Keys', value: stats.total, color: '#3b82f6' },
          { label: 'Available', value: stats.available, color: '#22c55e' },
          { label: 'Used', value: stats.used, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px 24px', minWidth: 130, flex: '1 1 100px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Generate Form */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div className="card-title">Generate New Activation Keys</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Plan Type</label>
            <select value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })} style={selectStyle}>
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration (months)</label>
            <input
              type="number" min={1} max={120} value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: parseInt(e.target.value) || 12 })}
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Quantity</label>
            <input
              type="number" min={1} max={500} value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              style={{ ...inputStyle, width: 80 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Batch ID</label>
            <input
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              placeholder="e.g. BATCH-001"
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button type="submit" disabled={generating || !form.batchId} style={btnStyle}>
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {genMsg && <div style={{ marginTop: 12, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{genMsg}</div>}
        {genError && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{genError}</div>}

        {newKeys.length > 0 && (
          <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#166534' }}>
              Generated Keys (copy now):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {newKeys.map((k) => (
                <code key={k.id} style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-surface-hover)', padding: '3px 10px', borderRadius: 6 }}>
                  {k.key_code}
                </code>
              ))}
            </div>
            {newKeys[0]?.batch_id && (
              <button onClick={() => handleExport(newKeys[0].batch_id)} style={{ ...btnStyle, marginTop: 12, background: '#0ea5e9' }}>
                Export Batch CSV
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Batch ID</label>
          <input
            value={filters.batch_id}
            onChange={(e) => { setFilters({ ...filters, batch_id: e.target.value }); setPage(1); }}
            placeholder="Filter by batch"
            style={{ ...inputStyle, width: 160 }}
          />
        </div>
        <div>
          <label style={labelStyle}>Plan Type</label>
          <select value={filters.plan_type} onChange={(e) => { setFilters({ ...filters, plan_type: e.target.value }); setPage(1); }} style={selectStyle}>
            <option value="">All Plans</option>
            {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select value={filters.is_used} onChange={(e) => { setFilters({ ...filters, is_used: e.target.value }); setPage(1); }} style={selectStyle}>
            <option value="">All</option>
            <option value="0">Available</option>
            <option value="1">Used</option>
          </select>
        </div>
        {filters.batch_id && (
          <button onClick={() => handleExport(filters.batch_id)} style={{ ...btnStyle, background: '#0ea5e9', alignSelf: 'flex-end' }}>
            Export Batch CSV
          </button>
        )}
      </div>

      {/* Keys Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="loader" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Key Code</th>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Used By</th>
                  <th>Used At</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td><code style={{ fontSize: 12 }}>{k.key_code}</code></td>
                    <td>
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>
                        {k.plan_type}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{k.duration_months}m</td>
                    <td style={{ fontSize: 12 }}>{k.batch_id || '—'}</td>
                    <td>
                      <span style={{
                        background: `${k.is_used ? statusColor.used : statusColor.available}20`,
                        color: k.is_used ? statusColor.used : statusColor.available,
                        padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      }}>
                        {k.is_used ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{k.user ? `${k.user.full_name || ''} (${k.user.email})` : '—'}</td>
                    <td style={{ fontSize: 12 }}>{k.used_at ? new Date(k.used_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: 12 }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No activation keys found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={paginationBtn}>‹ Prev</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '32px' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={paginationBtn}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 };
const inputStyle = { padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 };
const selectStyle = { ...inputStyle };
const btnStyle = { padding: '10px 20px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 };
const paginationBtn = { padding: '6px 14px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 };
