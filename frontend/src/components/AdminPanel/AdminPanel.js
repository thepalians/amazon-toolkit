import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [system, setSystem] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); loadSystem(); loadUsers(); }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin-panel/stats');
      setStats(res.data.stats);
      setRecentUsers(res.data.recentUsers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied');
    }
  };

  const loadSystem = async () => {
    try { const res = await api.get('/admin-panel/system'); setSystem(res.data.system); } catch { /* */ }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get(`/admin-panel/users?search=${search}&page=${page}`);
      setUsers(res.data.users || []);
      setTotalUsers(res.data.total || 0);
    } catch { /* */ }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/admin-panel/users/${userId}/role`, { role });
      loadUsers(); loadStats();
    } catch { /* */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, [search, page]);

  if (error) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ fontSize: 40, marginBottom: 10 }}>🔒</p>
      <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>{error}</p>
      <p style={{ color: '#6b7280', fontSize: 13 }}>You need admin access to view this page</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🛡️ Admin Panel</h2>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>System overview, user management, and analytics</p>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {['overview', 'users', 'system'].map((t, i) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : 0, fontSize: 13 }}
            onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '⚙️ System'}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, color: '#3b82f6', icon: '👥' },
              { label: 'New Today', value: stats.newToday, color: '#22c55e', icon: '🆕' },
              { label: 'This Week', value: stats.newThisWeek, color: '#f59e0b', icon: '📅' },
              { label: 'This Month', value: stats.newThisMonth, color: '#8b5cf6', icon: '📆' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {stats.growth && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">📈 User Signups (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.growth}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="#FF9900" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.tableCounts && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">📊 Data Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {Object.entries(stats.tableCounts).map(([k, v]) => (
                  <div key={k} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FF9900' }}>{v}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{k.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="card-title">🆕 Recent Signups</h3>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{new Date(u.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="card" style={{ marginBottom: 16, padding: '10px 14px' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-control" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or email..." style={{ flex: 1 }} />
              <span style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {totalUsers} users
              </span>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                      <td style={{ fontSize: 12 }}>{u.email}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: u.role === 'admin' ? '#fef3c7' : '#f3f4f6', color: u.role === 'admin' ? '#92400e' : '#6b7280' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <select className="form-control" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '2px 6px', fontSize: 11, width: 80 }}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} style={{ fontSize: 12 }}>← Prev</button>
              <span style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>Page {page}</span>
              <button className="btn btn-secondary" onClick={() => setPage(page + 1)} disabled={users.length < 25} style={{ fontSize: 12 }}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'system' && system && (
        <div className="card">
          <h3 className="card-title">⚙️ System Information</h3>
          {[
            ['Node.js', system.nodeVersion],
            ['Environment', system.env],
            ['Uptime', system.uptime],
            ['Memory (RSS)', `${system.memoryMB} MB`],
            ['Heap Used', `${system.heapMB} MB`],
            ['DB Tables', system.tables],
            ['DB Size', `${system.dbSizeMB} MB`],
            ['Platform', system.platform],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
