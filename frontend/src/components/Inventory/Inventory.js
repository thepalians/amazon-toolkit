import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_STYLES = {
  healthy: { bg: '#f0fdf4', color: '#16a34a', label: '✅ Healthy' },
  low_stock: { bg: '#fffbeb', color: '#d97706', label: '🟡 Low Stock' },
  reorder_now: { bg: '#fff7ed', color: '#ea580c', label: '⚠️ Reorder Now' },
  out_of_stock: { bg: '#fef2f2', color: '#dc2626', label: '🔴 Out of Stock' },
};

export default function Inventory() {
  const { currentCountry, countries, countryCode, changeCountry } = useCountry();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [form, setForm] = useState({
    asin: '', sku: '', product_title: '', current_stock: '100', daily_sales: '5',
    lead_time_days: '14', safety_stock_days: '7', reorder_quantity: '100',
    cost_per_unit: '', selling_price: '', supplier_name: '', notes: '',
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/list');
      setItems(res.data.items || []);
      setSummary(res.data.summary || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/add', { ...form, country_code: countryCode });
      setShowAdd(false);
      setForm({ asin: '', sku: '', product_title: '', current_stock: '100', daily_sales: '5',
        lead_time_days: '14', safety_stock_days: '7', reorder_quantity: '100',
        cost_per_unit: '', selling_price: '', supplier_name: '', notes: '' });
      loadItems();
    } catch { /* silent */ }
  };

  const handleRestock = async (id) => {
    if (!restockQty || restockQty <= 0) return;
    try {
      await api.post(`/inventory/restock/${id}`, { quantity: parseInt(restockQty) });
      setRestockId(null); setRestockQty('');
      loadItems();
    } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    try { await api.delete(`/inventory/delete/${id}`); loadItems(); } catch { /* silent */ }
  };

  const curr = currentCountry?.currencySymbol || '$';

  const exportColumns = [
    { label: 'ASIN', accessor: 'asin' },
    { label: 'SKU', accessor: 'sku' },
    { label: 'Product', accessor: 'product_title' },
    { label: 'Stock', accessor: 'current_stock' },
    { label: 'Daily Sales', accessor: 'daily_sales' },
    { label: 'Days Left', accessor: (r) => r.forecast?.daysRemaining },
    { label: 'Stockout Date', accessor: (r) => r.forecast?.stockoutDate || 'N/A' },
    { label: 'Reorder Point', accessor: (r) => r.forecast?.reorderPoint },
    { label: 'Suggested Reorder', accessor: (r) => r.forecast?.suggestedReorder },
    { label: 'Status', accessor: (r) => r.forecast?.status },
  ];

  const chartData = items.slice(0, 10).map(i => ({
    name: i.asin,
    days: i.forecast?.daysRemaining || 0,
    fill: i.forecast?.statusColor || '#6b7280',
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📦 Inventory Forecasting</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Track stock levels, predict stockouts, and plan reorders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {items.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(items, exportColumns, 'inventory-forecast')}
              onPDF={() => exportToPDF(items, exportColumns, 'inventory-forecast', `Inventory Forecast — ${items.length} items`)}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '✕ Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Items', value: summary.totalItems || 0, color: '#3b82f6', icon: '📦' },
          { label: 'Healthy', value: summary.healthy || 0, color: '#22c55e', icon: '✅' },
          { label: 'Low Stock', value: summary.lowStock || 0, color: '#f59e0b', icon: '🟡' },
          { label: 'Reorder Now', value: summary.needsReorder || 0, color: '#f97316', icon: '⚠️' },
          { label: 'Out of Stock', value: summary.outOfStock || 0, color: '#ef4444', icon: '🔴' },
          { label: 'Inventory Value', value: `${curr}${(summary.totalValue || 0).toLocaleString()}`, color: '#8b5cf6', icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Add Product to Inventory</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">ASIN *</label>
                <input className="form-control" value={form.asin} onChange={(e) => setForm({...form, asin: e.target.value})} placeholder="B0BSHF7WHW" required /></div>
              <div className="form-group"><label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} placeholder="Optional" /></div>
              <div className="form-group" style={{flex:2}}><label className="form-label">Product Title</label>
                <input className="form-control" value={form.product_title} onChange={(e) => setForm({...form, product_title: e.target.value})} placeholder="Product name" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Current Stock</label>
                <input className="form-control" type="number" min="0" value={form.current_stock} onChange={(e) => setForm({...form, current_stock: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Daily Sales (units)</label>
                <input className="form-control" type="number" step="0.1" min="0" value={form.daily_sales} onChange={(e) => setForm({...form, daily_sales: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Lead Time (days)</label>
                <input className="form-control" type="number" min="1" value={form.lead_time_days} onChange={(e) => setForm({...form, lead_time_days: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Safety Stock (days)</label>
                <input className="form-control" type="number" min="0" value={form.safety_stock_days} onChange={(e) => setForm({...form, safety_stock_days: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Cost/Unit ({currentCountry?.currency})</label>
                <input className="form-control" type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({...form, cost_per_unit: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Sell Price ({currentCountry?.currency})</label>
                <input className="form-control" type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({...form, selling_price: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Supplier</label>
                <input className="form-control" value={form.supplier_name} onChange={(e) => setForm({...form, supplier_name: e.target.value})} placeholder="Optional" /></div>
              <div className="form-group"><label className="form-label">Reorder Qty</label>
                <input className="form-control" type="number" min="1" value={form.reorder_quantity} onChange={(e) => setForm({...form, reorder_quantity: e.target.value})} /></div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>📦 Add to Inventory</button>
          </form>
        </div>
      )}

      {/* Stock Days Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📊 Days of Stock Remaining</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Inventory Table */}
      {items.length > 0 ? (
        <div className="card">
          <h3 className="card-title">📋 Inventory ({items.length})</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ASIN / SKU</th>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Daily Sales</th>
                  <th>Days Left</th>
                  <th>Stockout Date</th>
                  <th>Reorder Point</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const f = item.forecast || {};
                  const st = STATUS_STYLES[f.status] || STATUS_STYLES.healthy;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF9900' }}>{item.asin}</div>
                        {item.sku && <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.sku}</div>}
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product_title || '—'}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 16 }}>{item.current_stock}</td>
                      <td>{item.daily_sales}/day</td>
                      <td style={{ fontWeight: 700, color: f.statusColor }}>{f.daysRemaining < 999 ? `${f.daysRemaining} days` : '∞'}</td>
                      <td style={{ fontSize: 12 }}>{f.stockoutDate || '—'}</td>
                      <td>
                        <span style={{ fontSize: 12 }}>{f.reorderPoint} units</span>
                        {f.needsReorder && <div style={{ fontSize: 11, color: '#f97316' }}>Order: {f.suggestedReorder}</div>}
                      </td>
                      <td><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {restockId === item.id ? (
                            <>
                              <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                                style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 12 }} placeholder="Qty" />
                              <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleRestock(item.id)}>✅</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setRestockId(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => { setRestockId(item.id); setRestockQty(''); }}>📦 Restock</button>
                              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleDelete(item.id)}>🗑️</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>📦</p>
          <p style={{ color: '#6b7280', fontSize: 15 }}>No inventory items yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Add your first product to start forecasting</p>
        </div>
      )}
    </div>
  );
}
