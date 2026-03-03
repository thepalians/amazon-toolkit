import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function SalesEstimator() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ bsr: '', category: 'All Departments', price: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState([{ bsr: '', category: 'All Departments', price: '' }]);
  const [bulkResults, setBulkResults] = useState([]);

  useEffect(() => { loadCategories(selectedCountry); }, [selectedCountry]);

  const loadCategories = async (cc) => {
    try {
      const res = await api.get(`/sales-estimator/categories/${cc}`);
      setCategories(res.data.categories || []);
    } catch { /* silent */ }
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await api.post('/sales-estimator/estimate', {
        bsr: parseInt(form.bsr),
        category: form.category,
        countryCode: selectedCountry,
        price: parseFloat(form.price) || 0,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Estimation failed.');
    } finally { setLoading(false); }
  };

  const handleBulkEstimate = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setBulkResults([]);
    try {
      const validItems = bulkItems.filter(i => i.bsr > 0);
      const res = await api.post('/sales-estimator/bulk', { items: validItems, countryCode: selectedCountry });
      setBulkResults(res.data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk estimation failed.');
    } finally { setLoading(false); }
  };

  const addBulkItem = () => {
    if (bulkItems.length >= 20) return;
    setBulkItems([...bulkItems, { bsr: '', category: 'All Departments', price: '' }]);
  };

  const removeBulkItem = (idx) => {
    setBulkItems(bulkItems.filter((_, i) => i !== idx));
  };

  const updateBulkItem = (idx, field, value) => {
    const updated = [...bulkItems];
    updated[idx][field] = value;
    setBulkItems(updated);
  };

  const currency = currentCountry?.currency || 'USD';
  const currSymbol = { USD: '$', INR: '₹', GBP: '£', AED: 'AED ', EUR: '€', CAD: 'C$' }[currency] || '$';

  // Export columns
  const singleColumns = [
    { label: 'BSR', accessor: 'bsr' },
    { label: 'Category', accessor: 'category' },
    { label: 'Daily Sales', accessor: (r) => r.estimates?.dailySales },
    { label: 'Monthly Sales', accessor: (r) => r.estimates?.monthlySales },
    { label: 'Monthly Revenue', accessor: (r) => `${currSymbol}${r.estimates?.monthlyRevenue}` },
    { label: 'Yearly Revenue', accessor: (r) => `${currSymbol}${r.estimates?.yearlyRevenue}` },
    { label: 'Velocity', accessor: (r) => r.analysis?.velocityRating },
    { label: 'Competition', accessor: (r) => r.analysis?.competition },
  ];

  const bulkColumns = [
    { label: 'BSR', accessor: 'bsr' },
    { label: 'Category', accessor: 'category' },
    { label: 'Daily Sales', accessor: (r) => r.estimates?.dailySales },
    { label: 'Monthly Sales', accessor: (r) => r.estimates?.monthlySales },
    { label: 'Range', accessor: (r) => `${r.estimates?.salesRange?.low}-${r.estimates?.salesRange?.high}` },
    { label: 'Monthly Revenue', accessor: (r) => r.estimates?.monthlyRevenue },
    { label: 'Velocity', accessor: (r) => r.analysis?.velocityRating },
    { label: 'Competition', accessor: (r) => r.analysis?.competition },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📊 Sales Estimator (BSR)</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Estimate monthly sales from Amazon Best Seller Rank
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(result || bulkResults.length > 0) && (
            <ExportButton
              onCSV={() => bulkMode
                ? exportToCSV(bulkResults, bulkColumns, 'sales-estimates-bulk')
                : exportToCSV([result], singleColumns, 'sales-estimate')}
              onPDF={() => bulkMode
                ? exportToPDF(bulkResults, bulkColumns, 'sales-estimates-bulk', 'Bulk Sales Estimates')
                : exportToPDF([result], singleColumns, 'sales-estimate', `Sales Estimate — BSR #${result?.bsr}`)}
            />
          )}
          <button className="btn btn-secondary" onClick={() => { setBulkMode(!bulkMode); setResult(null); setBulkResults([]); }}>
            {bulkMode ? '📊 Single Mode' : '📋 Bulk Mode'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* SINGLE MODE */}
      {!bulkMode && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Enter Product Details</h3>
            <form onSubmit={handleEstimate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Marketplace</label>
                  <select className="form-control" value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Best Seller Rank (BSR)</label>
                  <input className="form-control" type="number" min="1" value={form.bsr}
                    onChange={(e) => setForm({ ...form, bsr: e.target.value })} placeholder="e.g. 5000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Price ({currency})</label>
                  <input className="form-control" type="number" step="0.01" min="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 999" />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <span className="loader" /> : '📊 Estimate Sales'}
              </button>
            </form>
          </div>

          {result && (
            <div>
              {/* Big Numbers */}
              <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Daily Sales</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>
                      {result.estimates.dailySales}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>units/day</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Monthly Sales</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
                      {result.estimates.monthlySales.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{result.estimates.salesRange.low}-{result.estimates.salesRange.high} range</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Monthly Revenue</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#FF9900' }}>
                      {currSymbol}{result.estimates.monthlyRevenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{currSymbol}{result.estimates.yearlyRevenue.toLocaleString()}/year</div>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 className="card-title">Analysis</h3>
                {[
                  { label: 'BSR Rank', value: `#${result.bsr.toLocaleString()}`, sub: result.category },
                  { label: 'Sales Velocity', value: result.analysis.velocityRating, color: result.analysis.velocityColor },
                  { label: 'Competition Level', value: result.analysis.competition, color: result.analysis.competitionColor },
                  { label: 'Seasonal Factor', value: `×${result.seasonalMultiplier}`, sub: `Month ${result.currentMonth}` },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
                  }}>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                      {item.sub && <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Formula */}
              <div className="card" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>📐 Formula Used</div>
                <code style={{ fontSize: 12, color: '#78350f', wordBreak: 'break-all' }}>{result.formula.equation}</code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BULK MODE */}
      {bulkMode && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title">Bulk Estimate (up to 20 ASINs)</h3>
            <form onSubmit={handleBulkEstimate}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Marketplace</label>
                <select className="form-control" value={selectedCountry} style={{ maxWidth: 200 }}
                  onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}>
                  {countries.map(c => <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>)}
                </select>
              </div>

              {bulkItems.map((item, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    {idx === 0 && <label className="form-label">BSR</label>}
                    <input className="form-control" type="number" min="1" value={item.bsr}
                      onChange={(e) => updateBulkItem(idx, 'bsr', e.target.value)} placeholder="BSR" required />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    {idx === 0 && <label className="form-label">Category</label>}
                    <select className="form-control" value={item.category}
                      onChange={(e) => updateBulkItem(idx, 'category', e.target.value)}>
                      {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    {idx === 0 && <label className="form-label">Price</label>}
                    <input className="form-control" type="number" step="0.01" value={item.price}
                      onChange={(e) => updateBulkItem(idx, 'price', e.target.value)} placeholder="Price" />
                  </div>
                  <button type="button" className="btn btn-danger" style={{ padding: '8px 10px', marginBottom: 4 }}
                    onClick={() => removeBulkItem(idx)} disabled={bulkItems.length <= 1}>🗑️</button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={addBulkItem}
                  disabled={bulkItems.length >= 20}>+ Add Row</button>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? <span className="loader" /> : `📊 Estimate All (${bulkItems.filter(i => i.bsr).length})`}
                </button>
              </div>
            </form>
          </div>

          {bulkResults.length > 0 && (
            <div className="card">
              <h3 className="card-title">Bulk Results</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>BSR</th>
                      <th>Category</th>
                      <th>Daily</th>
                      <th>Monthly Sales</th>
                      <th>Range</th>
                      <th>Revenue/Month</th>
                      <th>Velocity</th>
                      <th>Competition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{r.bsr?.toLocaleString()}</td>
                        <td style={{ fontSize: 12 }}>{r.category}</td>
                        <td>{r.estimates?.dailySales}</td>
                        <td style={{ fontWeight: 700 }}>{r.estimates?.monthlySales?.toLocaleString()}</td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>{r.estimates?.salesRange?.low}-{r.estimates?.salesRange?.high}</td>
                        <td style={{ fontWeight: 600, color: '#FF9900' }}>{currSymbol}{r.estimates?.monthlyRevenue?.toLocaleString()}</td>
                        <td><span className="badge" style={{ background: r.analysis?.velocityColor, color: '#fff', fontSize: 11 }}>{r.analysis?.velocityRating}</span></td>
                        <td><span className="badge" style={{ background: r.analysis?.competitionColor, color: '#fff', fontSize: 11 }}>{r.analysis?.competition}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
