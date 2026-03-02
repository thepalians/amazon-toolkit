import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const PLAN_OPTIONS = ['basic', 'premium', 'pro'];

export default function AdminLicenseKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [newKeys, setNewKeys] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ plan_name: 'basic', duration: 'monthly', quantity: 1, notes: '' });
  const [genMsg, setGenMsg] = useState('');
  const [genError, setGenError] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;
      const res = await adminApi.get('/admin/license-keys', { params });
      setKeys(res.data.keys || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, [statusFilter, planFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenMsg('');
    setGenError('');
    setNewKeys([]);
    try {
      const res = await adminApi.post('/admin/license-keys/generate', form);
      setNewKeys(res.data.keys || []);
      setGenMsg(`Generated ${res.data.keys?.length} key(s) successfully.`);
      fetchKeys();
    } catch (err) {
      setGenError(err.response?.data?.message || 'Failed to generate keys.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this license key?')) return;
    try {
      await adminApi.put(`/admin/license-keys/${id}/revoke`);
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke key.');
    }
  };

  const statusColor = { unused: '#22c55e', active: '#3b82f6', expired: '#f59e0b', revoked: '#ef4444' };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>License Keys</h2>

      {/* Generate Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Generate New License Keys</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Plan</label>
            <select value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}>
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Duration</label>
            <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Quantity</label>
            <input type="number" min={1} max={100} value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, width: 80 }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Amazon order #123"
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, width: '100%' }} />
          </div>
          <button type="submit" disabled={generating}
            style={{ padding: '10px 20px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {genMsg && <div style={{ marginTop: 12, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{genMsg}</div>}
        {genError && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>{genError}</div>}

        {newKeys.length > 0 && (
          <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#166534' }}>Generated Keys (copy now):</div>
            {newKeys.map((k) => (
              <div key={k.id} style={{ fontFamily: 'monospace', fontSize: 14, padding: '4px 0', color: '#111827' }}>{k.license_key}</div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          <option value="unused">Unused</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Plans</option>
          {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
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
                  <th>License Key</th>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Activated By</th>
                  <th>Expires</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td><code style={{ fontSize: 12 }}>{k.license_key}</code></td>
                    <td><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{k.plan_name}</span></td>
                    <td>{k.duration}</td>
                    <td>
                      <span style={{ background: `${statusColor[k.status]}20`, color: statusColor[k.status], padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        {k.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(k.created_at).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{k.activated_by || '—'}</td>
                    <td style={{ fontSize: 12 }}>{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: 12 }}>{k.notes || '—'}</td>
                    <td>
                      {k.status !== 'revoked' && k.status !== 'expired' && (
                        <button onClick={() => handleRevoke(k.id)}
                          style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No license keys found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
