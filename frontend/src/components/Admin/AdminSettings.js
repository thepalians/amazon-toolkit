import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

const SETTING_GROUPS = [
  {
    title: 'General',
    keys: [
      { key: 'site_name', label: 'Site Name', type: 'text' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'checkbox' },
      { key: 'allow_new_registrations', label: 'Allow New Registrations', type: 'checkbox' },
    ],
  },
  {
    title: 'Rate Limiting',
    keys: [
      { key: 'rate_limit_per_minute', label: 'Max Requests / Minute', type: 'number' },
    ],
  },
  {
    title: 'Email (SMTP)',
    keys: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number' },
      { key: 'smtp_user', label: 'SMTP Username', type: 'text' },
      { key: 'smtp_from', label: 'From Address', type: 'text' },
    ],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    adminApi.get('/admin/settings')
      .then((res) => setSettings(res.data.settings || {}))
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.put('/admin/settings', settings);
      setSuccess('Settings saved successfully.');
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><span className="loader" /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>System Settings</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave}>
        {SETTING_GROUPS.map((group) => (
          <div className="card" key={group.title}>
            <div className="card-title">{group.title}</div>
            {group.keys.map(({ key, label, type }) => (
              <div className="form-group" key={key}>
                {type === 'checkbox' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      id={key}
                      checked={settings[key] === 'true'}
                      onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')}
                    />
                    <label htmlFor={key} className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                  </div>
                ) : (
                  <>
                    <label className="form-label">{label}</label>
                    <input
                      className="form-control"
                      style={{ maxWidth: 400 }}
                      type={type}
                      value={settings[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? <span className="loader" /> : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}
