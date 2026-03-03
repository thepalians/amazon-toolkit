import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const CATEGORIES = [
  'general', 'electronics', 'computers', 'books', 'clothing', 'shoes',
  'jewelry', 'watches', 'grocery', 'health', 'beauty', 'toys', 'sports',
  'automotive', 'home', 'garden', 'kitchen', 'tools', 'pet', 'baby',
  'furniture', 'appliances', 'music', 'video_games', 'software', 'office',
];

export default function FBAFees() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [form, setForm] = useState({
    sellingPrice: '',
    costPrice: '',
    category: 'general',
    weight: '0.5',
    length: '25',
    width: '15',
    height: '10',
    storageDuration: 'standard',
    unitsPerMonth: '1',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/fba-fees/calculate', {
        ...form,
        sellingPrice: parseFloat(form.sellingPrice),
        costPrice: parseFloat(form.costPrice),
        weight: parseFloat(form.weight),
        length: parseFloat(form.length),
        width: parseFloat(form.width),
        height: parseFloat(form.height),
        unitsPerMonth: parseInt(form.unitsPerMonth),
        countryCode: selectedCountry,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Export
  const handleExportCSV = () => {
    if (!result) return;
    const data = [
      ...result.fees.map(f => ({ item: f.name, description: f.description, amount: f.amount, rate: f.rate })),
      { item: 'TOTAL FEES', description: 'Including tax', amount: result.totalFeesWithTax, rate: '' },
      { item: 'NET PROFIT', description: '', amount: result.netProfit, rate: `${result.profitMargin}%` },
      { item: 'ROI', description: '', amount: '', rate: `${result.roi}%` },
    ];
    const columns = [
      { label: 'Fee Item', accessor: 'item' },
      { label: 'Description', accessor: 'description' },
      { label: 'Amount', accessor: 'amount' },
      { label: 'Rate', accessor: 'rate' },
    ];
    exportToCSV(data, columns, 'fba-fee-breakdown');
  };

  const handleExportPDF = () => {
    if (!result) return;
    const data = [
      ...result.fees.map(f => ({ item: f.name, description: f.description, amount: f.amount, rate: f.rate })),
      { item: 'TOTAL FEES', description: 'Including tax', amount: result.totalFeesWithTax, rate: '' },
      { item: 'NET PROFIT', description: '', amount: result.netProfit, rate: `${result.profitMargin}%` },
      { item: 'ROI', description: '', amount: '', rate: `${result.roi}%` },
    ];
    const columns = [
      { label: 'Fee Item', accessor: 'item' },
      { label: 'Description', accessor: 'description' },
      { label: 'Amount', accessor: 'amount' },
      { label: 'Rate', accessor: 'rate' },
    ];
    exportToPDF(data, columns, 'fba-fee-breakdown', `FBA Fee Breakdown — ${result.currencySymbol}${result.sellingPrice} | Profit: ${result.currencySymbol}${result.netProfit}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🏷️ FBA Fee Breakdown</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Detailed Amazon FBA fee calculator — know every fee before you sell
          </p>
        </div>
        {result && <ExportButton onCSV={handleExportCSV} onPDF={handleExportPDF} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Input Form */}
        <div className="card">
          <h3 className="card-title">Product Details</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marketplace</label>
                <select className="form-control" value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Selling Price ({currentCountry?.currency || 'USD'})</label>
                <input className="form-control" type="number" name="sellingPrice" value={form.sellingPrice}
                  onChange={handleChange} step="0.01" min="0" placeholder="999.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price ({currentCountry?.currency || 'USD'})</label>
                <input className="form-control" type="number" name="costPrice" value={form.costPrice}
                  onChange={handleChange} step="0.01" min="0" placeholder="500.00" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-control" type="number" name="weight" value={form.weight}
                  onChange={handleChange} step="0.01" min="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Length (cm)</label>
                <input className="form-control" type="number" name="length" value={form.length}
                  onChange={handleChange} step="0.1" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Width (cm)</label>
                <input className="form-control" type="number" name="width" value={form.width}
                  onChange={handleChange} step="0.1" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input className="form-control" type="number" name="height" value={form.height}
                  onChange={handleChange} step="0.1" min="1" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Storage Period</label>
                <select className="form-control" name="storageDuration" value={form.storageDuration} onChange={handleChange}>
                  <option value="standard">Standard (Jan-Sep)</option>
                  <option value="peak">Peak (Oct-Dec)</option>
                  <option value="longTerm">Long-Term (365+ days)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Units/Month</label>
                <input className="form-control" type="number" name="unitsPerMonth" value={form.unitsPerMonth}
                  onChange={handleChange} min="1" />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="loader" /> : '🏷️ Calculate FBA Fees'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div>
            {/* Profit Summary Card */}
            <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Net Profit</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: result.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                    {result.currencySymbol}{result.netProfit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Margin</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: result.profitMargin >= 20 ? '#22c55e' : result.profitMargin >= 10 ? '#f59e0b' : '#ef4444' }}>
                    {result.profitMargin}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>ROI</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: result.roi >= 50 ? '#22c55e' : result.roi >= 20 ? '#f59e0b' : '#ef4444' }}>
                    {result.roi}%
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${result.netProfit >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                  {result.netProfit >= 0 ? '✅ Profitable' : '❌ Loss'} | Size Tier: {result.sizeTier}
                </span>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">Fee Breakdown</h3>
              {result.fees.map((fee, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: i < result.fees.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{fee.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{fee.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{fee.description}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{result.currencySymbol}{fee.amount}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{fee.rate}</div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', marginTop: 8, borderTop: '2px solid var(--border-color)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>💰 Total Amazon Fees</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#FF9900' }}>
                  {result.currencySymbol}{result.totalFeesWithTax}
                </div>
              </div>
            </div>

            {/* Visual Breakdown */}
            <div className="card">
              <h3 className="card-title">Cost Distribution</h3>
              {[
                { label: 'Cost Price', value: result.costPrice, color: '#6b7280' },
                { label: 'Amazon Fees', value: result.totalFeesWithTax, color: '#FF9900' },
                { label: 'Profit', value: Math.max(result.netProfit, 0), color: '#22c55e' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{result.currencySymbol}{item.value} ({result.sellingPrice > 0 ? ((item.value / result.sellingPrice) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 5 }}>
                    <div style={{
                      width: `${result.sellingPrice > 0 ? (item.value / result.sellingPrice) * 100 : 0}%`,
                      height: '100%', borderRadius: 5, background: item.color, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
