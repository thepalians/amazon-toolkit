import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminApi.get('/admin/plans')
      .then((res) => setPlans(res.data.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEditing = (plan) => {
    setEditing(plan.id);
    setEditValues({ price_monthly: plan.price_monthly, price_yearly: plan.price_yearly });
  };

  const handleSave = async (plan) => {
    try {
      await adminApi.put(`/admin/plans/${plan.id}`, {
        price_monthly: parseFloat(editValues.price_monthly),
        price_yearly: parseFloat(editValues.price_yearly),
        is_active: plan.is_active,
      });
      setPlans((prev) => prev.map((p) => p.id === plan.id
        ? { ...p, price_monthly: editValues.price_monthly, price_yearly: editValues.price_yearly }
        : p));
      setEditing(null);
      setEditValues({});
      setMsg('Plan updated successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update plan.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><span className="loader" /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Subscription Plans</h2>
      {msg && <div style={{ marginBottom: 16, color: '#22c55e', fontWeight: 600, fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {plans.map((plan) => {
          const isEditing = editing === plan.id;
          return (
            <div key={plan.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{plan.display_name}</div>
                <span style={{ background: plan.is_active ? '#dcfce7' : '#fee2e2', color: plan.is_active ? '#166534' : '#dc2626',
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {isEditing ? (
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Monthly Price (₹)</label>
                  <input type="number" value={editValues.price_monthly}
                    onChange={(e) => setEditValues((v) => ({ ...v, price_monthly: e.target.value }))}
                    style={{ display: 'block', width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 8 }} />
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Yearly Price (₹)</label>
                  <input type="number" value={editValues.price_yearly}
                    onChange={(e) => setEditValues((v) => ({ ...v, price_yearly: e.target.value }))}
                    style={{ display: 'block', width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => handleSave(plan)}
                      style={{ flex: 1, padding: '8px 0', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                      Save
                    </button>
                    <button onClick={() => { setEditing(null); setEditValues({}); }}
                      style={{ flex: 1, padding: '8px 0', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 2 }}>
                    <div>Monthly: <strong>₹{parseFloat(plan.price_monthly).toLocaleString('en-IN')}</strong></div>
                    <div>Yearly: <strong>₹{parseFloat(plan.price_yearly).toLocaleString('en-IN')}</strong></div>
                  </div>
                  <button onClick={() => startEditing(plan)}
                    style={{ marginTop: 12, width: '100%', padding: '8px 0', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                    Edit Pricing
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
