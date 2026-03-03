import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function BulkOps() {
  const { countryCode, countries, changeCountry, currentCountry } = useCountry();
  const [tab, setTab] = useState('asin');
  const [asinInput, setAsinInput] = useState('');
  const [asinResults, setAsinResults] = useState([]);
  const [profitItems, setProfitItems] = useState([{ name: '', sellPrice: '', costPrice: '', fbaPercent: '15', shipping: '3' }]);
  const [profitResults, setProfitResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const curr = currentCountry?.currencySymbol || '$';

  const handleAsinLookup = async () => {
    const asins = asinInput.split(/[\n,;]+/).map(a => a.trim()).filter(a => a.length === 10);
    if (asins.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/bulk/asin-lookup', { asins, countryCode });
      setAsinResults(res.data.results || []);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleBulkProfit = async () => {
    const valid = profitItems.filter(i => i.sellPrice && i.costPrice);
    if (valid.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/bulk/profit-calc', { items: valid });
      setProfitResults(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const addProfitRow = () => {
    setProfitItems([...profitItems, { name: '', sellPrice: '', costPrice: '', fbaPercent: '15', shipping: '3' }]);
  };

  const updateProfitRow = (idx, field, val) => {
    const items = [...profitItems];
    items[idx][field] = val;
    setProfitItems(items);
  };

  const removeProfitRow = (idx) => {
    if (profitItems.length <= 1) return;
    setProfitItems(profitItems.filter((_, i) => i !== idx));
  };

  const asinCols = [
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Title', accessor: (r) => r.title?.substring(0, 80) },
    { label: 'Price', accessor: (r) => r.price ? `${curr}${r.price}` : 'N/A' },
    { label: 'Rating', accessor: 'rating' },
    { label: 'Reviews', accessor: 'reviews' },
    { label: 'BSR', accessor: (r) => r.bsr ? `#${r.bsr.toLocaleString()}` : 'N/A' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>⚡ Bulk Operations</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Process multiple ASINs and calculations at once</p>
        </div>
        {asinResults.length > 0 && tab === 'asin' && (
          <ExportButton
            onCSV={() => exportToCSV(asinResults, asinCols, 'bulk-asin')}
            onPDF={() => exportToPDF(asinResults, asinCols, 'bulk-asin', 'Bulk ASIN Lookup')}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {[
          { key: 'asin', label: '🔍 Bulk ASIN Lookup' },
          { key: 'profit', label: '💰 Bulk Profit Calc' },
        ].map((t, i) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: i === 0 ? '8px 0 0 8px' : '0 8px 8px 0', fontSize: 13 }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Bulk ASIN */}
      {tab === 'asin' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marketplace</label>
                <select className="form-control" value={countryCode} onChange={(e) => changeCountry(e.target.value)}>
                  {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 3 }}>
                <label className="form-label">ASINs (one per line, max 10)</label>
                <textarea className="form-control" rows="4" value={asinInput} onChange={(e) => setAsinInput(e.target.value)}
                  placeholder="B0BSHF7WHW&#10;B09V3KXJPB&#10;B0CHWRXH8B" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAsinLookup} disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Looking up...' : '🔍 Bulk Lookup'}
            </button>
          </div>

          {asinResults.length > 0 && (
            <div className="card">
              <h3 className="card-title">Results ({asinResults.length})</h3>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ASIN</th><th>Title</th><th>Price</th><th>Rating</th><th>Reviews</th><th>BSR</th></tr></thead>
                  <tbody>
                    {asinResults.map((r, i) => (
                      <tr key={i} style={{ opacity: r.found ? 1 : 0.5 }}>
                        <td style={{ fontFamily: 'monospace', color: '#FF9900', fontWeight: 700 }}>{r.asin}</td>
                        <td style={{ fontSize: 12, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || 'Not found'}</td>
                        <td style={{ fontWeight: 700, color: '#22c55e' }}>{r.price > 0 ? `${curr}${r.price}` : '—'}</td>
                        <td>{r.rating > 0 ? `${r.rating}⭐` : '—'}</td>
                        <td>{r.reviews > 0 ? r.reviews.toLocaleString() : '—'}</td>
                        <td>{r.bsr > 0 ? `#${r.bsr.toLocaleString()}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Profit */}
      {tab === 'profit' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Product</th><th>Sell ({curr})</th><th>Cost ({curr})</th><th>FBA %</th><th>Shipping</th><th></th></tr></thead>
                <tbody>
                  {profitItems.map((item, idx) => (
                    <tr key={idx}>
                      <td><input className="form-control" value={item.name} onChange={(e) => updateProfitRow(idx, 'name', e.target.value)} placeholder="Product name" style={{ fontSize: 12 }} /></td>
                      <td><input className="form-control" type="number" step="0.01" value={item.sellPrice} onChange={(e) => updateProfitRow(idx, 'sellPrice', e.target.value)} style={{ width: 80 }} /></td>
                      <td><input className="form-control" type="number" step="0.01" value={item.costPrice} onChange={(e) => updateProfitRow(idx, 'costPrice', e.target.value)} style={{ width: 80 }} /></td>
                      <td><input className="form-control" type="number" value={item.fbaPercent} onChange={(e) => updateProfitRow(idx, 'fbaPercent', e.target.value)} style={{ width: 60 }} /></td>
                      <td><input className="form-control" type="number" step="0.01" value={item.shipping} onChange={(e) => updateProfitRow(idx, 'shipping', e.target.value)} style={{ width: 70 }} /></td>
                      <td><button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => removeProfitRow(idx)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={addProfitRow} style={{ fontSize: 12 }}>+ Add Row</button>
              <button className="btn btn-primary" onClick={handleBulkProfit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Calculating...' : '💰 Calculate All'}
              </button>
            </div>
          </div>

          {profitResults && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{profitResults.summary.total}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Products</div>
                </div>
                <div className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{profitResults.summary.profitable}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Profitable</div>
                </div>
                <div className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: profitResults.summary.totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                    {curr}{profitResults.summary.totalProfit}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Total Profit</div>
                </div>
              </div>

              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Product</th><th>Sell</th><th>Cost</th><th>FBA</th><th>Profit</th><th>Margin</th><th>ROI</th></tr></thead>
                    <tbody>
                      {profitResults.results.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12 }}>{r.name || `Item ${i+1}`}</td>
                          <td>{curr}{r.sellPrice}</td>
                          <td>{curr}{r.costPrice}</td>
                          <td style={{ color: '#ef4444' }}>{curr}{r.fbaFee}</td>
                          <td style={{ fontWeight: 700, color: r.profitable ? '#22c55e' : '#ef4444' }}>{curr}{r.profit}</td>
                          <td style={{ color: r.margin >= 20 ? '#22c55e' : '#f59e0b' }}>{r.margin}%</td>
                          <td>{r.roi}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
