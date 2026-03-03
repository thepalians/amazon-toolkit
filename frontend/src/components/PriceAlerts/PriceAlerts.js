import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const ALERT_TYPES = [
  { value: 'below', label: '📉 Price Drops Below', icon: '📉' },
  { value: 'above', label: '📈 Price Goes Above', icon: '📈' },
  { value: 'change', label: '💰 Any Price Change', icon: '💰' },
  { value: 'out_of_stock', label: '⚠️ Goes Out of Stock', icon: '⚠️' },
  { value: 'back_in_stock', label: '✅ Back in Stock', icon: '✅' },
];

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  // New alert form
  const [form, setForm] = useState({
    trackingId: '',
    alertType: 'below',
    targetPrice: '',
    notifyInApp: true,
    notifyEmail: false,
  });

  useEffect(() => {
    loadAlerts();
    loadTrackedItems();
    loadNotifications();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts || []);
    } catch { /* silent */ }
  };

  const loadTrackedItems = async () => {
    try {
      const res = await api.get('/competitor/list');
      setTrackedItems(res.data.items || []);
    } catch { /* silent */ }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/alerts/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/alerts', {
        trackingId: parseInt(form.trackingId),
        alertType: form.alertType,
        targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
        notifyInApp: form.notifyInApp,
        notifyEmail: form.notifyEmail,
      });
      setSuccess('Alert created successfully!');
      setShowForm(false);
      setForm({ trackingId: '', alertType: 'below', targetPrice: '', notifyInApp: true, notifyEmail: false });
      await loadAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create alert.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (id, isActive) => {
    try {
      await api.put(`/alerts/${id}`, { isActive: !isActive });
      await loadAlerts();
    } catch {
      setError('Failed to update alert.');
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Failed to delete alert.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/alerts/notifications/read');
      await loadNotifications();
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/alerts/notifications/${id}/read`);
      await loadNotifications();
    } catch { /* silent */ }
  };

  // Export
  const alertColumns = [
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Product', accessor: (r) => r.tracking?.product_title || 'N/A' },
    { label: 'Alert Type', accessor: 'alert_type' },
    { label: 'Target Price', accessor: (r) => r.target_price || 'N/A' },
    { label: 'Status', accessor: (r) => r.is_triggered ? 'Triggered' : r.is_active ? 'Active' : 'Paused' },
    { label: 'Triggered Price', accessor: (r) => r.triggered_price || 'N/A' },
    { label: 'Created', accessor: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const notifColumns = [
    { label: 'Title', accessor: 'title' },
    { label: 'Message', accessor: 'message' },
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Price', accessor: (r) => r.new_price ? `${r.currency || ''}${r.new_price}` : 'N/A' },
    { label: 'Date', accessor: (r) => new Date(r.createdAt).toLocaleString() },
    { label: 'Read', accessor: (r) => r.is_read ? 'Yes' : 'No' },
  ];

  const needsPrice = ['below', 'above'].includes(form.alertType);

  const alertTypeIcon = (type) => {
    const found = ALERT_TYPES.find(t => t.value === type);
    return found ? found.icon : '🔔';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔔 Price Alerts</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'alerts' && alerts.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(alerts, alertColumns, 'price-alerts')}
              onPDF={() => exportToPDF(alerts, alertColumns, 'price-alerts', `Price Alerts — ${alerts.length} alerts`)}
            />
          )}
          {activeTab === 'notifications' && notifications.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(notifications, notifColumns, 'alert-notifications')}
              onPDF={() => exportToPDF(notifications, notifColumns, 'alert-notifications', `Alert Notifications`)}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Alert'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border-color)' }}>
        {[
          { key: 'alerts', label: `🔔 Alerts (${alerts.length})` },
          { key: 'notifications', label: `📬 Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ''}` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'transparent',
              borderBottom: activeTab === tab.key ? '2px solid #FF9900' : '2px solid transparent',
              color: activeTab === tab.key ? '#FF9900' : 'var(--text-secondary)',
              marginBottom: -2,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Create New Alert</h3>
          {trackedItems.length === 0 ? (
            <div className="alert alert-info">
              No tracked ASINs found. Go to <strong>Competitor Monitor</strong> first and track an ASIN.
            </div>
          ) : (
            <form onSubmit={handleCreateAlert}>
              <div className="form-row">
                <div className="form-group" style={{ flexGrow: 2 }}>
                  <label className="form-label">Select Tracked ASIN</label>
                  <select className="form-control" value={form.trackingId}
                    onChange={(e) => setForm({ ...form, trackingId: e.target.value })} required>
                    <option value="">-- Select ASIN --</option>
                    {trackedItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.asin} — {item.product_title || 'Unknown'} ({item.country_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Alert Type</label>
                  <select className="form-control" value={form.alertType}
                    onChange={(e) => setForm({ ...form, alertType: e.target.value })}>
                    {ALERT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {needsPrice && (
                <div className="form-group">
                  <label className="form-label">Target Price</label>
                  <input className="form-control" type="number" step="0.01" min="0"
                    value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                    placeholder="e.g. 999.00" required />
                </div>
              )}

              <div className="form-row">
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="notifyApp" checked={form.notifyInApp}
                    onChange={(e) => setForm({ ...form, notifyInApp: e.target.checked })} />
                  <label htmlFor="notifyApp" style={{ fontSize: 14 }}>🔔 In-App Notification</label>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="notifyEmail" checked={form.notifyEmail}
                    onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })} />
                  <label htmlFor="notifyEmail" style={{ fontSize: 14 }}>📧 Email Notification (coming soon)</label>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <span className="loader" /> : '🔔 Create Alert'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ALERTS TAB */}
      {activeTab === 'alerts' && (
        <>
          {alerts.length === 0 ? (
            <div className="alert alert-info">
              No alerts set. Click "+ New Alert" to create your first price alert.
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ASIN</th>
                      <th>Product</th>
                      <th>Alert Type</th>
                      <th>Target Price</th>
                      <th>Status</th>
                      <th>Triggered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{alert.asin}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {alert.tracking?.product_title || 'N/A'}
                        </td>
                        <td>
                          <span className="badge badge-blue">{alertTypeIcon(alert.alert_type)} {alert.alert_type}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {alert.target_price ? `${alert.currency || ''}${alert.target_price}` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${alert.is_triggered ? 'badge-green' : alert.is_active ? 'badge-yellow' : 'badge-gray'}`}>
                            {alert.is_triggered ? '✅ Triggered' : alert.is_active ? '👁️ Watching' : '⏸️ Paused'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>
                          {alert.triggered_at ? (
                            <span>{alert.currency}{alert.triggered_price} — {new Date(alert.triggered_at).toLocaleDateString()}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleToggleAlert(alert.id, alert.is_active)}>
                              {alert.is_active ? '⏸️' : '▶️'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleDeleteAlert(alert.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <>
          {unreadCount > 0 && (
            <div style={{ marginBottom: 12, textAlign: 'right' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={handleMarkAllRead}>
                ✅ Mark All as Read
              </button>
            </div>
          )}
          {notifications.length === 0 ? (
            <div className="alert alert-info">
              No notifications yet. Alerts will appear here when triggered.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map(notif => (
                <div key={notif.id} className="card" style={{
                  padding: '14px 18px', cursor: 'pointer',
                  borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #FF9900',
                  opacity: notif.is_read ? 0.7 : 1,
                }} onClick={() => !notif.is_read && handleMarkRead(notif.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{notif.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{notif.message}</div>
                      {notif.new_price && (
                        <div style={{ marginTop: 6 }}>
                          <span className="badge badge-green">{notif.currency}{notif.new_price}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {new Date(notif.createdAt).toLocaleString()}
                      {!notif.is_read && <span style={{ color: '#FF9900', fontWeight: 700, marginLeft: 6 }}>● NEW</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
