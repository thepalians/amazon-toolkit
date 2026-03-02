import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editKey, setEditKey] = useState(null);
  const [editForm, setEditForm] = useState({ service_name: '', api_key: '', api_secret: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [addNew, setAddNew] = useState(false);

  const fetchKeys = () => {
    setLoading(true);
    setError('');
    adminApi.get('/admin/api-keys')
      .then((res) => setKeys(res.data.api_keys))
      .catch(() => setError('Failed to load API keys.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const openEdit = (k) => {
    setAddNew(false);
    setEditKey(k);
    setEditForm({ service_name: k.service_name, api_key: '', api_secret: '', is_active: k.is_active });
  };

  const openAdd = () => {
    setEditKey(null);
    setAddNew(true);
    setEditForm({ service_name: '', api_key: '', api_secret: '', is_active: true });
  };

  const handleSave = async () => {
    if (!editForm.service_name) { alert('Service name is required.'); return; }
    setSaving(true);
    try {
      await adminApi.put('/admin/api-keys', editForm);
      setEditKey(null);
      setAddNew(false);
      fetchKeys();
    } catch {
      alert('Failed to save API key.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (k) => {
    try {
      await adminApi.put('/admin/api-keys', { service_name: k.service_name, is_active: !k.is_active });
      fetchKeys();
    } catch {
      alert('Failed to toggle.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>API Key Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add API Key</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>API Key</th>
                <th>API Secret</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="loader" /></td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>No API keys configured</td></tr>
              ) : keys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontFamily: 'monospace' }}>{k.service_name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{k.api_key || <em style={{ color: '#9ca3af' }}>not set</em>}</td>
                  <td style={{ fontFamily: 'monospace' }}>{k.api_secret || <em style={{ color: '#9ca3af' }}>not set</em>}</td>
                  <td>
                    <span className={`badge ${k.is_active ? 'badge-green' : 'badge-red'}`}>
                      {k.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{k.updated_at ? new Date(k.updated_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(k)}>Edit</button>
                      <button
                        className={`btn ${k.is_active ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => toggleActive(k)}
                      >
                        {k.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {(editKey || addNew) && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 460, maxWidth: '95vw' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{addNew ? 'Add API Key' : `Edit: ${editKey.service_name}`}</h3>
            {addNew && (
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input className="form-control" placeholder="e.g. amazon_sp_api" value={editForm.service_name} onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">API Key {!addNew && <span style={{ fontSize: 11, color: '#9ca3af' }}>(leave blank to keep existing)</span>}</label>
              <input className="form-control" type="password" placeholder="••••••••••••" value={editForm.api_key} onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">API Secret {!addNew && <span style={{ fontSize: 11, color: '#9ca3af' }}>(leave blank to keep existing)</span>}</label>
              <input className="form-control" type="password" placeholder="••••••••••••" value={editForm.api_secret} onChange={(e) => setEditForm({ ...editForm, api_secret: e.target.value })} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="is_active" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0 }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setEditKey(null); setAddNew(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="loader" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
