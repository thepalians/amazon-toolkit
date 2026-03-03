import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const TYPE_COLORS = { revenue: '#22c55e', expense: '#ef4444', refund: '#f59e0b', ad_spend: '#8b5cf6', fba_fee: '#3b82f6', shipping: '#06b6d4', cogs: '#f97316', other: '#6b7280' };
const TYPE_LABELS = { revenue: 'Revenue', expense: 'Expense', refund: 'Refund', ad_spend: 'Ad Spend', fba_fee: 'FBA Fee', shipping: 'Shipping', cogs: 'COGS', other: 'Other' };

export default function Financial() {
  const { currentCountry } = useCountry();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    record_date: new Date().toISOString().split('T')[0], record_type: 'revenue',
    category: '', description: '', amount: '', asin: '', order_id: '', notes: '',
  });

  useEffect(() => { loadRecords(); loadMonthly(); }, [year, month, filterType]);

  const loadRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (filterType) params.append('type', filterType);
      const res = await api.get(`/financial/records?${params.toString()}`);
      setRecords(res.data.records || []);
      setSummary(res.data.summary || {});
    } catch { /* */ }
  };

  const loadMonthly = async () => {
    try {
      const res = await api.get(`/financial/monthly-summary?year=${year}`);
      setMonthlySummary(res.data.monthlySummary || []);
    } catch { /* */ }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financial/add', { ...form, currency: currentCountry?.currency || 'USD' });
      setShowAdd(false);
      setForm({ record_date: new Date().toISOString().split('T')[0], record_type: 'revenue', category: '', description: '', amount: '', asin: '', order_id: '', notes: '' });
      loadRecords(); loadMonthly();
    } catch { /* */ }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/financial/delete/${id}`); loadRecords(); loadMonthly(); } catch { /* */ }
  };

  const curr = currentCountry?.currencySymbol || '$';

  const exportColumns = [
    { label: 'Date', accessor: 'record_date' },
    { label: 'Type', accessor: 'record_type' },
    { label: 'Category', accessor: 'category' },
    { label: 'Description', accessor: 'description' },
    { label: 'Amount', accessor: (r) => `${curr}${r.amount}` },
    { label: 'ASIN', accessor: 'asin' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>💰 Financial Reports</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Track revenue, expenses, P&L and monthly summaries</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {records.length > 0 && (
            <ExportButton
              onCSV={() => exportToCSV(records, exportColumns, `financial-${year}`)}
              onPDF={() => exportToPDF(records, exportColumns, `financial-${year}`, `Financial Report ${year}`)}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ Add Record'}</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Revenue', value: `${curr}${(summary.revenue || 0).toLocaleString()}`, color: '#22c55e', icon: '💰' },
          { label: 'Expenses', value: `${curr}${(summary.expenses || 0).toLocaleString()}`, color: '#ef4444', icon: '💸' },
          { label: 'Net Profit', value: `${curr}${(summary.netProfit || 0).toLocaleString()}`, color: (summary.netProfit || 0) >= 0 ? '#22c55e' : '#ef4444', icon: '📈' },
          { label: 'Margin', value: `${summary.profitMargin || 0}%`, color: (summary.profitMargin || 0) >= 20 ? '#22c55e' : '#f59e0b', icon: '📊' },
          { label: 'Ad Spend', value: `${curr}${(summary.adSpend || 0).toLocaleString()}`, color: '#8b5cf6', icon: '🎯' },
          { label: 'FBA Fees', value: `${curr}${(summary.fbaFees || 0).toLocaleString()}`, color: '#3b82f6', icon: '📦' },
          { label: 'Refunds', value: `${curr}${(summary.refunds || 0).toLocaleString()}`, color: '#f59e0b', icon: '↩️' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly P&L Chart */}
      {monthlySummary.some(m => m.revenue > 0 || m.expenses > 0) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📊 Monthly P&L — {year}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySummary}>
              <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '12px 18px' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group"><label className="form-label">Year</label>
            <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Month</label>
            <select className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Add Financial Record</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date *</label>
                <input className="form-control" type="date" value={form.record_date} onChange={(e) => setForm({...form, record_date: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Type *</label>
                <select className="form-control" value={form.record_type} onChange={(e) => setForm({...form, record_type: e.target.value})}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Amount ({curr}) *</label>
                <input className="form-control" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">ASIN</label>
                <input className="form-control" value={form.asin} onChange={(e) => setForm({...form, asin: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex:2}}><label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Category</label>
                <input className="form-control" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} /></div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Add Record</button>
          </form>
        </div>
      )}

      {/* Records Table */}
      {records.length > 0 ? (
        <div className="card">
          <h3 className="card-title">📋 Records ({records.length})</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>ASIN</th><th></th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12 }}>{r.record_date}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${TYPE_COLORS[r.record_type]}20`, color: TYPE_COLORS[r.record_type] }}>{TYPE_LABELS[r.record_type]}</span></td>
                    <td style={{ fontSize: 13 }}>{r.description || r.category || '—'}</td>
                    <td style={{ fontWeight: 700, color: r.record_type === 'revenue' ? '#22c55e' : '#ef4444' }}>{curr}{r.amount}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF9900' }}>{r.asin || '—'}</td>
                    <td><button className="btn btn-danger" style={{ padding: '2px 6px', fontSize: 10 }} onClick={() => handleDelete(r.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>💰</p>
          <p style={{ color: '#6b7280' }}>No financial records yet — add your first entry</p>
        </div>
      )}
    </div>
  );
}
