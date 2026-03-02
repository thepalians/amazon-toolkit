import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [revenueData, setRevenueData] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.get('/admin/subscriptions', { params: { status: statusFilter || undefined } }),
      adminApi.get('/admin/revenue'),
    ])
      .then(([subRes, revRes]) => {
        setSubs(subRes.data.subscriptions || []);
        setRevenueData(revRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statusColor = { active: '#22c55e', expired: '#f59e0b', cancelled: '#ef4444' };

  const totalRevenue = revenueData?.byPlan?.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Subscriptions & Revenue</h2>

      {/* Revenue Summary */}
      {revenueData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #FF9900' }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FF9900', marginTop: 4 }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #3b82f6' }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Active Subscriptions</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{subs.filter(s => s.status === 'active').length}</div>
          </div>
          {revenueData.byPlan?.map((p) => (
            <div key={p.plan_name} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{p.plan_name} revenue</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6', marginTop: 4 }}>₹{parseFloat(p.total).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.count} payments</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="loader" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.user_id}</td>
                    <td><span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{s.plan_name}</span></td>
                    <td>{s.duration}</td>
                    <td>
                      <span style={{ background: `${statusColor[s.status]}20`, color: statusColor[s.status], padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(s.starts_at).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(s.expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No subscriptions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
