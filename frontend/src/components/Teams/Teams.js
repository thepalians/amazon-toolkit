import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ROLE_COLORS = { owner: '#FF9900', admin: '#8b5cf6', editor: '#3b82f6', viewer: '#6b7280' };

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState(null);
  const [form, setForm] = useState({ team_name: '', description: '', max_members: '5' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try { const res = await api.get('/teams/list'); setTeams(res.data.teams || []); } catch { /* */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams/create', form);
      setShowCreate(false);
      setForm({ team_name: '', description: '', max_members: '5' });
      loadTeams();
    } catch { /* */ }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams/invite', { team_id: inviteTeamId, ...inviteForm });
      setInviteTeamId(null);
      setInviteForm({ email: '', role: 'viewer' });
      loadTeams();
      alert('Invitation sent');
    } catch (err) {
      alert(err.response?.data?.message || 'Invite failed');
    }
  };

  const handleAccept = async (teamId) => {
    try { await api.post(`/teams/accept/${teamId}`); loadTeams(); } catch { /* */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    try { await api.delete(`/teams/delete/${id}`); loadTeams(); } catch { /* */ }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>👥 Teams</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Collaborate with your team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Team'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Create Team</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Team Name *</label>
                <input className="form-control" value={form.team_name} onChange={(e) => setForm({...form, team_name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Max Members</label>
                <input className="form-control" type="number" min="2" max="50" value={form.max_members} onChange={(e) => setForm({...form, max_members: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Team</button>
          </form>
        </div>
      )}

      {teams.length > 0 ? teams.map(t => (
        <div key={t.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>👥 {t.team_name}</h3>
              {t.description && <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{t.description}</p>}
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {(t.members || []).filter(m => m.status === 'active').length}/{t.max_members} members
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {t.owner_id === user.id && (
                <>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setInviteTeamId(inviteTeamId === t.id ? null : t.id)}>+ Invite</button>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDelete(t.id)}>🗑️</button>
                </>
              )}
            </div>
          </div>

          {inviteTeamId === t.id && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Email</label>
                  <input className="form-control" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Role</label>
                  <select className="form-control" value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}>
                    <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" style={{ padding: '8px 16px', fontSize: 12 }}>Send</button>
              </form>
            </div>
          )}

          {/* Members */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(t.members || []).map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: ROLE_COLORS[m.role], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {m.user_id === user.id ? 'Me' : m.role[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>User #{m.user_id}</div>
                  <div style={{ fontSize: 10, color: ROLE_COLORS[m.role], fontWeight: 600 }}>{m.role} • {m.status}</div>
                </div>
                {m.status === 'invited' && m.user_id === user.id && (
                  <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => handleAccept(t.id)}>Accept</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>👥</p>
          <p style={{ color: '#6b7280' }}>No teams yet — create one to collaborate</p>
        </div>
      )}
    </div>
  );
}
