import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const PLATFORMS = ['manual', 'Alibaba', 'IndiaMart', '1688', 'Made-in-China', 'TradeIndia', 'GlobalSources', 'DHgate', 'Other'];
const COUNTRIES = ['China', 'India', 'Vietnam', 'Bangladesh', 'Thailand', 'Turkey', 'Pakistan', 'Taiwan', 'USA', 'UK', 'Germany', 'Other'];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [sort, setSort] = useState('');
  const [form, setForm] = useState({
    supplier_name: '', contact_person: '', email: '', phone: '', website: '',
    country: 'China', city: '', platform: 'Alibaba', product_categories: '',
    min_order_qty: '100', avg_lead_time_days: '14', payment_terms: '', rating: '3', notes: '',
  });

  useEffect(() => { loadSuppliers(); }, [search, filterCountry, filterPlatform, sort]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCountry) params.append('country', filterCountry);
      if (filterPlatform) params.append('platform', filterPlatform);
      if (sort) params.append('sort', sort);
      const res = await api.get(`/suppliers/list?${params.toString()}`);
      setSuppliers(res.data.suppliers || []);
      setStats(res.data.stats || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/suppliers/update/${editId}`, form);
      } else {
        await api.post('/suppliers/add', form);
      }
      resetForm();
      loadSuppliers();
    } catch { /* silent */ }
  };

  const handleEdit = (s) => {
    setForm({
      supplier_name: s.supplier_name || '', contact_person: s.contact_person || '',
      email: s.email || '', phone: s.phone || '', website: s.website || '',
      country: s.country || 'China', city: s.city || '', platform: s.platform || 'Alibaba',
      product_categories: s.product_categories || '', min_order_qty: String(s.min_order_qty || 100),
      avg_lead_time_days: String(s.avg_lead_time_days || 14), payment_terms: s.payment_terms || '',
      rating: String(s.rating || 3), notes: s.notes || '',
    });
    setEditId(s.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this supplier?')) return;
    try { await api.delete(`/suppliers/delete/${id}`); loadSuppliers(); } catch { /* silent */ }
  };

  const resetForm = () => {
    setForm({
      supplier_name: '', contact_person: '', email: '', phone: '', website: '',
      country: 'China', city: '', platform: 'Alibaba', product_categories: '',
      min_order_qty: '100', avg_lead_time_days: '14', payment_terms: '', rating: '3', notes: '',
    });
    setEditId(null);
    setShowAdd(false);
  };

  const exportColumns = [
    { label: 'Supplier', accessor: 'supplier_name' },
    { label: 'Contact', accessor: 'contact_person' },
    { label: 'Email', accessor: 'email' },
    { label: 'Phone', accessor: 'phone' },
    { label: 'Country', accessor: 'country' },
    { label: 'Platform', accessor: 'platform' },
    { label: 'Categories', accessor: 'product_categories' },
    { label: 'MOQ', accessor: 'min_order_qty' },
    { label: 'Lead Time', accessor: (r) => `${r.avg_lead_time_days} days` },
    { label: 'Rating', accessor: (r) => `${'★'.repeat(r.rating || 0)}` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🏭 Supplier Database</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Manage your supplier contacts, MOQ, lead times and ratings</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {suppliers.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(suppliers, exportColumns, 'suppliers')}
              onPDF={() => exportToPDF(suppliers, exportColumns, 'suppliers', `Supplier Database — ${suppliers.length} suppliers`)}
            />
          )}
          <button className="btn btn-primary" onClick={() => { showAdd ? resetForm() : setShowAdd(true); }}>
            {showAdd ? 'Cancel' : '+ Add Supplier'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>{stats.total || 0}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Total Suppliers</div>
        </div>
        {Object.entries(stats.byCountry || {}).slice(0, 4).map(([c, count]) => (
          <div key={c} className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FF9900' }}>{count}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{c}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '12px 18px' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ flex: 2 }}>
            <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers, contacts, categories..." />
          </div>
          <div className="form-group">
            <select className="form-control" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="">All Countries</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <select className="form-control" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
              <option value="">All Platforms</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <select className="form-control" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Recent</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
              <option value="lead_time">Fastest Lead</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">{editId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Supplier Name *</label>
                <input className="form-control" value={form.supplier_name} onChange={(e) => setForm({...form, supplier_name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Contact Person</label>
                <input className="form-control" value={form.contact_person} onChange={(e) => setForm({...form, contact_person: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Platform</label>
                <select className="form-control" value={form.platform} onChange={(e) => setForm({...form, platform: e.target.value})}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Website</label>
                <input className="form-control" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://..." /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Country</label>
                <select className="form-control" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">City</label>
                <input className="form-control" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">MOQ (units)</label>
                <input className="form-control" type="number" min="0" value={form.min_order_qty} onChange={(e) => setForm({...form, min_order_qty: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Lead Time (days)</label>
                <input className="form-control" type="number" min="1" value={form.avg_lead_time_days} onChange={(e) => setForm({...form, avg_lead_time_days: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Product Categories</label>
                <input className="form-control" value={form.product_categories} onChange={(e) => setForm({...form, product_categories: e.target.value})} placeholder="e.g. Electronics, Home & Kitchen" /></div>
              <div className="form-group"><label className="form-label">Payment Terms</label>
                <input className="form-control" value={form.payment_terms} onChange={(e) => setForm({...form, payment_terms: e.target.value})} placeholder="e.g. 30% advance" /></div>
              <div className="form-group"><label className="form-label">Rating (1-5)</label>
                <select className="form-control" value={form.rating} onChange={(e) => setForm({...form, rating: e.target.value})}>
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5-r)} ({r})</option>)}
                </select></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
              {editId ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </form>
        </div>
      )}

      {/* Supplier Cards */}
      {suppliers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card" style={{ margin: 0, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.supplier_name}</h4>
                  {s.contact_person && <div style={{ fontSize: 13, color: '#6b7280' }}>👤 {s.contact_person}</div>}
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: 'rgba(255,153,0,0.12)', color: '#FF9900',
                }}>{s.platform}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 13 }}>
                <div><span style={{ color: '#9ca3af' }}>📍</span> {s.country}{s.city ? `, ${s.city}` : ''}</div>
                <div><span style={{ color: '#9ca3af' }}>📦</span> MOQ: {s.min_order_qty || 'N/A'}</div>
                <div><span style={{ color: '#9ca3af' }}>🕐</span> Lead: {s.avg_lead_time_days} days</div>
                <div style={{ color: '#f59e0b' }}>{'★'.repeat(s.rating || 0)}{'☆'.repeat(5 - (s.rating || 0))}</div>
              </div>

              {s.product_categories && (
                <div style={{ marginBottom: 10 }}>
                  {s.product_categories.split(',').map((cat, i) => (
                    <span key={i} style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
                      background: 'var(--bg-secondary)', color: 'var(--text-secondary)', margin: '2px 4px 2px 0',
                    }}>{cat.trim()}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 10, color: '#6b7280' }}>
                {s.email && <span>📧 {s.email}</span>}
                {s.phone && <span>📞 {s.phone}</span>}
              </div>

              {s.payment_terms && (
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>💳 {s.payment_terms}</div>
              )}

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                {s.website && (
                  <a href={s.website} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>🌐 Website</a>
                )}
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleEdit(s)}>✏️ Edit</button>
                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDelete(s.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🏭</p>
          <p style={{ color: '#6b7280', fontSize: 15 }}>No suppliers added yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Add your first supplier from Alibaba, IndiaMart, or manually</p>
        </div>
      )}
    </div>
  );
}
