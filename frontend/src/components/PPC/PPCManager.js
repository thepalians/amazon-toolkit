import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const STATUS_COLORS = { active: '#22c55e', paused: '#f59e0b', ended: '#6b7280', draft: '#3b82f6' };
const MATCH_COLORS = { exact: '#8b5cf6', phrase: '#3b82f6', broad: '#f59e0b' };

export default function PPCManager() {
  const { currentCountry } = useCountry();
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddKw, setShowAddKw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('campaigns');

  const [campForm, setCampForm] = useState({
    campaign_name: '', campaign_type: 'sponsored_products', status: 'active',
    daily_budget: '50', total_budget: '1500', targeting_type: 'manual', bid_strategy: 'fixed', notes: '',
  });
  const [kwForm, setKwForm] = useState({ keyword: '', match_type: 'exact', bid: '1.00', impressions: '', clicks: '', spend: '', sales: '', orders: '' });

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ppc/campaigns');
      setCampaigns(res.data.campaigns || []);
      setSummary(res.data.summary || {});
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ppc/campaigns', campForm);
      setShowAdd(false);
      setCampForm({ campaign_name: '', campaign_type: 'sponsored_products', status: 'active', daily_budget: '50', total_budget: '1500', targeting_type: 'manual', bid_strategy: 'fixed', notes: '' });
      loadCampaigns();
    } catch { /* */ }
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.post('/ppc/keywords', { campaign_id: selectedCampaign.id, ...kwForm });
      setShowAddKw(false);
      setKwForm({ keyword: '', match_type: 'exact', bid: '1.00', impressions: '', clicks: '', spend: '', sales: '', orders: '' });
      loadCampaigns();
      // Refresh selected
      const res = await api.get('/ppc/campaigns');
      const updated = (res.data.campaigns || []).find(c => c.id === selectedCampaign.id);
      if (updated) setSelectedCampaign(updated);
    } catch { /* */ }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete campaign and all keywords?')) return;
    try { await api.delete(`/ppc/campaigns/${id}`); setSelectedCampaign(null); loadCampaigns(); } catch { /* */ }
  };

  const handleDeleteKeyword = async (id) => {
    try {
      await api.delete(`/ppc/keywords/${id}`);
      loadCampaigns();
      if (selectedCampaign) {
        const res = await api.get('/ppc/campaigns');
        const updated = (res.data.campaigns || []).find(c => c.id === selectedCampaign.id);
        if (updated) setSelectedCampaign(updated);
      }
    } catch { /* */ }
  };

  const loadSuggestions = async (campaignId) => {
    try {
      const res = await api.get(`/ppc/optimizer/${campaignId}`);
      setSuggestions(res.data.suggestions || []);
      setTab('optimizer');
    } catch { /* */ }
  };

  const curr = currentCountry?.currencySymbol || '$';

  const campExportCols = [
    { label: 'Campaign', accessor: 'campaign_name' },
    { label: 'Type', accessor: 'campaign_type' },
    { label: 'Status', accessor: 'status' },
    { label: 'Spend', accessor: (r) => `${curr}${r.total_spend}` },
    { label: 'Sales', accessor: (r) => `${curr}${r.total_sales}` },
    { label: 'ACoS', accessor: (r) => `${r.acos}%` },
    { label: 'ROAS', accessor: (r) => `${r.roas}x` },
    { label: 'Clicks', accessor: 'total_clicks' },
    { label: 'Orders', accessor: 'total_orders' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎯 PPC Campaign Manager</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Manage Amazon PPC campaigns, keywords, bids and get optimization suggestions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {campaigns.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(campaigns, campExportCols, 'ppc-campaigns')}
              onPDF={() => exportToPDF(campaigns, campExportCols, 'ppc-campaigns', 'PPC Campaigns Report')}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ New Campaign'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Campaigns', value: summary.totalCampaigns || 0, color: '#3b82f6', icon: '🎯' },
          { label: 'Total Spend', value: `${curr}${(summary.totalSpend || 0).toLocaleString()}`, color: '#ef4444', icon: '💸' },
          { label: 'Total Sales', value: `${curr}${(summary.totalSales || 0).toLocaleString()}`, color: '#22c55e', icon: '💰' },
          { label: 'ACoS', value: `${summary.overallAcos || 0}%`, color: summary.overallAcos > 30 ? '#ef4444' : '#22c55e', icon: '📊' },
          { label: 'ROAS', value: `${summary.overallRoas || 0}x`, color: summary.overallRoas >= 3 ? '#22c55e' : '#f59e0b', icon: '📈' },
          { label: 'Clicks', value: (summary.totalClicks || 0).toLocaleString(), color: '#8b5cf6', icon: '👆' },
          { label: 'Orders', value: summary.totalOrders || 0, color: '#FF9900', icon: '📦' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Campaign Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Create Campaign</h3>
          <form onSubmit={handleAddCampaign}>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Campaign Name *</label>
                <input className="form-control" value={campForm.campaign_name} onChange={(e) => setCampForm({...campForm, campaign_name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-control" value={campForm.campaign_type} onChange={(e) => setCampForm({...campForm, campaign_type: e.target.value})}>
                  <option value="sponsored_products">Sponsored Products</option>
                  <option value="sponsored_brands">Sponsored Brands</option>
                  <option value="sponsored_display">Sponsored Display</option>
                </select></div>
              <div className="form-group"><label className="form-label">Targeting</label>
                <select className="form-control" value={campForm.targeting_type} onChange={(e) => setCampForm({...campForm, targeting_type: e.target.value})}>
                  <option value="manual">Manual</option><option value="automatic">Automatic</option>
                </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Daily Budget ({curr})</label>
                <input className="form-control" type="number" step="0.01" value={campForm.daily_budget} onChange={(e) => setCampForm({...campForm, daily_budget: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Total Budget ({curr})</label>
                <input className="form-control" type="number" step="0.01" value={campForm.total_budget} onChange={(e) => setCampForm({...campForm, total_budget: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Bid Strategy</label>
                <select className="form-control" value={campForm.bid_strategy} onChange={(e) => setCampForm({...campForm, bid_strategy: e.target.value})}>
                  <option value="fixed">Fixed</option><option value="dynamic_down">Dynamic Down</option><option value="dynamic_up_down">Dynamic Up & Down</option>
                </select></div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Campaign</button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {['campaigns', 'keywords', 'optimizer'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: t === 'campaigns' ? '8px 0 0 8px' : t === 'optimizer' ? '0 8px 8px 0' : 0, fontSize: 13 }}
            onClick={() => setTab(t)}>
            {t === 'campaigns' ? '🎯 Campaigns' : t === 'keywords' ? '🔤 Keywords' : '🤖 Optimizer'}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {tab === 'campaigns' && campaigns.length > 0 && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Campaign</th><th>Type</th><th>Status</th><th>Spend</th><th>Sales</th><th>ACoS</th><th>ROAS</th><th>Clicks</th><th>Orders</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer', background: selectedCampaign?.id === c.id ? 'var(--accent-light)' : 'transparent' }}
                    onClick={() => { setSelectedCampaign(c); setTab('keywords'); }}>
                    <td style={{ fontWeight: 700 }}>{c.campaign_name}</td>
                    <td style={{ fontSize: 11 }}>{c.campaign_type.replace(/_/g, ' ')}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status] }}>{c.status}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{curr}{c.total_spend}</td>
                    <td style={{ color: '#22c55e', fontWeight: 600 }}>{curr}{c.total_sales}</td>
                    <td style={{ fontWeight: 700, color: c.acos > 30 ? '#ef4444' : '#22c55e' }}>{c.acos}%</td>
                    <td style={{ fontWeight: 700, color: c.roas >= 3 ? '#22c55e' : '#f59e0b' }}>{c.roas}x</td>
                    <td>{c.total_clicks}</td>
                    <td>{c.total_orders}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }} onClick={() => loadSuggestions(c.id)}>🤖</button>
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10 }} onClick={() => handleDeleteCampaign(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {tab === 'keywords' && selectedCampaign && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔤 Keywords — {selectedCampaign.campaign_name}</h3>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowAddKw(!showAddKw)}>
              {showAddKw ? 'Cancel' : '+ Add Keyword'}
            </button>
          </div>

          {showAddKw && (
            <div className="card" style={{ marginBottom: 16 }}>
              <form onSubmit={handleAddKeyword}>
                <div className="form-row">
                  <div className="form-group" style={{flex:2}}><label className="form-label">Keyword *</label>
                    <input className="form-control" value={kwForm.keyword} onChange={(e) => setKwForm({...kwForm, keyword: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Match</label>
                    <select className="form-control" value={kwForm.match_type} onChange={(e) => setKwForm({...kwForm, match_type: e.target.value})}>
                      <option value="exact">Exact</option><option value="phrase">Phrase</option><option value="broad">Broad</option>
                    </select></div>
                  <div className="form-group"><label className="form-label">Bid ({curr})</label>
                    <input className="form-control" type="number" step="0.01" value={kwForm.bid} onChange={(e) => setKwForm({...kwForm, bid: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Impressions</label>
                    <input className="form-control" type="number" value={kwForm.impressions} onChange={(e) => setKwForm({...kwForm, impressions: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Clicks</label>
                    <input className="form-control" type="number" value={kwForm.clicks} onChange={(e) => setKwForm({...kwForm, clicks: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Spend ({curr})</label>
                    <input className="form-control" type="number" step="0.01" value={kwForm.spend} onChange={(e) => setKwForm({...kwForm, spend: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Sales ({curr})</label>
                    <input className="form-control" type="number" step="0.01" value={kwForm.sales} onChange={(e) => setKwForm({...kwForm, sales: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Orders</label>
                    <input className="form-control" type="number" value={kwForm.orders} onChange={(e) => setKwForm({...kwForm, orders: e.target.value})} /></div>
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Add Keyword</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Keyword</th><th>Match</th><th>Bid</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>Spend</th><th>Sales</th><th>Orders</th><th>ACoS</th><th>Conv%</th><th></th></tr>
                </thead>
                <tbody>
                  {(selectedCampaign.keywords || []).map(k => (
                    <tr key={k.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{k.keyword}</td>
                      <td><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: `${MATCH_COLORS[k.match_type]}20`, color: MATCH_COLORS[k.match_type] }}>{k.match_type}</span></td>
                      <td>{curr}{k.bid}</td>
                      <td>{k.impressions?.toLocaleString()}</td>
                      <td>{k.clicks}</td>
                      <td>{k.ctr}%</td>
                      <td>{curr}{k.cpc}</td>
                      <td style={{ color: '#ef4444' }}>{curr}{k.spend}</td>
                      <td style={{ color: '#22c55e', fontWeight: 600 }}>{curr}{k.sales}</td>
                      <td>{k.orders}</td>
                      <td style={{ fontWeight: 700, color: k.acos > 30 ? '#ef4444' : '#22c55e' }}>{k.acos}%</td>
                      <td>{k.conversion_rate}%</td>
                      <td><button className="btn btn-danger" style={{ padding: '2px 6px', fontSize: 10 }} onClick={() => handleDeleteKeyword(k.id)}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!selectedCampaign.keywords || selectedCampaign.keywords.length === 0) && (
              <div style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>No keywords yet — add your first keyword above</div>
            )}
          </div>
        </div>
      )}

      {/* Optimizer Tab */}
      {tab === 'optimizer' && (
        <div>
          {suggestions.length > 0 ? (
            <div className="card">
              <h3 className="card-title">🤖 AI Optimization Suggestions</h3>
              {suggestions.map((s, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {s.keyword && <span style={{ fontWeight: 700, fontSize: 14 }}>{s.keyword}</span>}
                        {s.matchType && <span style={{ padding: '1px 6px', borderRadius: 6, fontSize: 10, background: `${MATCH_COLORS[s.matchType]}20`, color: MATCH_COLORS[s.matchType] }}>{s.matchType}</span>}
                        <span style={{ padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: s.priority === 'high' ? '#fef2f2' : s.priority === 'medium' ? '#fffbeb' : '#f0fdf4', color: s.priority === 'high' ? '#dc2626' : s.priority === 'medium' ? '#d97706' : '#16a34a' }}>{s.priority}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 10 }}>🤖</p>
              <p style={{ color: '#6b7280' }}>Select a campaign and click 🤖 to get optimization suggestions</p>
            </div>
          )}
        </div>
      )}

      {tab === 'campaigns' && campaigns.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🎯</p>
          <p style={{ color: '#6b7280', fontSize: 15 }}>No PPC campaigns yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Create your first campaign to start managing Amazon PPC</p>
        </div>
      )}
    </div>
  );
}
