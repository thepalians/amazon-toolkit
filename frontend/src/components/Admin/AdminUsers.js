import React, { useEffect, useState, useCallback } from 'react';
import adminApi from '../../services/adminApi';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const limit = 20;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi.get('/admin/users', { params: { page, limit, search } })
      .then((res) => {
        setUsers(res.data.users);
        setTotal(res.data.total);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (user) => {
    const isCurrentlyDisabled = user.api_calls_remaining === -1;
    try {
      await adminApi.put(`/admin/users/${user.id}/status`, { is_active: isCurrentlyDisabled });
      fetchUsers();
    } catch {
      alert('Failed to update status.');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/users/${user.id}`);
      fetchUsers();
    } catch {
      alert('Failed to delete user.');
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email,
      subscription_plan: user.subscription_plan,
      api_calls_remaining: user.api_calls_remaining,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/admin/users/${editUser.id}`, editForm);
      setEditUser(null);
      fetchUsers();
    } catch {
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>User Management</h2>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="form-control"
          style={{ maxWidth: 300 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><span className="loader" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.country_code}</td>
                  <td><span className="badge badge-orange">{u.subscription_plan}</span></td>
                  <td>
                    <span className={`badge ${u.api_calls_remaining === -1 ? 'badge-red' : 'badge-green'}`}>
                      {u.api_calls_remaining === -1 ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(u)}>Edit</button>
                      <button
                        className={`btn ${u.api_calls_remaining === -1 ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.api_calls_remaining === -1 ? 'Enable' : 'Disable'}
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteUser(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ lineHeight: '38px', fontSize: 14 }}>Page {page} / {totalPages}</span>
          <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 440, maxWidth: '95vw' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Edit User #{editUser.id}</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Subscription Plan</label>
              <select className="form-control" value={editForm.subscription_plan} onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">API Calls Remaining</label>
              <input className="form-control" type="number" value={editForm.api_calls_remaining} onChange={(e) => setEditForm({ ...editForm, api_calls_remaining: parseInt(e.target.value, 10) })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? <span className="loader" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
