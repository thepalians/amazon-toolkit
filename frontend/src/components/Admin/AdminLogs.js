import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    setLoading(true);
    adminApi.get('/admin/logs', { params: { limit } })
      .then((res) => setLogs(res.data.logs))
      .catch(() => setError('Failed to load logs.'))
      .finally(() => setLoading(false));
  }, [limit]);

  const statusColor = (code) => {
    if (!code) return 'badge-gray';
    if (code < 300) return 'badge-green';
    if (code < 400) return 'badge-blue';
    if (code < 500) return 'badge-yellow';
    return 'badge-red';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>API Logs</h2>
        <select className="form-control" style={{ width: 120 }} value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
          <option value={25}>Last 25</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User ID</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Response (ms)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="loader" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>No logs available</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.user_id || '—'}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{log.method || '—'}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.endpoint || '—'}</td>
                  <td>
                    <span className={`badge ${statusColor(log.status_code)}`}>{log.status_code || '—'}</span>
                  </td>
                  <td>{log.response_time_ms != null ? `${log.response_time_ms} ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
