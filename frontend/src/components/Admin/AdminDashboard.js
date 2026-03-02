import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><span className="loader" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { stats, recentUsers } = data;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="#3b82f6" />
        <StatCard icon="📡" label="API Calls Today" value={stats.apiCallsToday} color="#FF9900" />
        <StatCard icon="✅" label="System Status" value={stats.systemStatus === 'ok' ? 'Healthy' : 'Issue'} color="#22c55e" />
      </div>

      {/* Recent registrations */}
      <div className="card">
        <div className="card-title">Recent Registrations</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Plan</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.country_code}</td>
                  <td><span className="badge badge-orange">{u.subscription_plan}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af' }}>No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}
