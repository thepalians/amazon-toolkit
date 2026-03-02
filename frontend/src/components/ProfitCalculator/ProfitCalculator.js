import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

const CATEGORIES = [
  'general', 'electronics', 'computers', 'books', 'clothing', 'shoes',
  'jewelry', 'watches', 'grocery', 'health', 'beauty', 'toys', 'sports',
  'automotive', 'home', 'garden', 'kitchen', 'tools', 'pet', 'baby',
];

const GST_SLABS = [
  { value: 'essential', label: 'Essential (5%)' },
  { value: 'standard', label: 'Standard (12%)' },
  { value: 'general', label: 'General (18%)' },
  { value: 'luxury', label: 'Luxury (28%)' },
];

export default function ProfitCalculator() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [form, setForm] = useState({
    buyPrice: '',
    sellPrice: '',
    weightKg: '0.5',
    shippingCost: '0',
    advertisingSpend: '0',
    category: 'general',
    quantity: '1',
    isFBA: true,
    gstSlab: 'general',
    countryCode,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/profit/calculate', {
        ...form,
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        weightKg: parseFloat(form.weightKg),
        shippingCost: parseFloat(form.shippingCost),
        advertisingSpend: parseFloat(form.advertisingSpend),
        quantity: parseInt(form.quantity),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  const sym = currentCountry?.symbol || currentCountry?.currencySymbol || '$';

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>💰 Profit Calculator</h2>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Form */}
        <div className="card">
          <h3 className="card-title">Product Details</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Marketplace Country</label>
              <select
                className="form-control"
                name="countryCode"
                value={form.countryCode}
                onChange={(e) => {
                  handleChange(e);
                  changeCountry(e.target.value);
                }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag || ''} {c.name} ({c.currency || c.currencyCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Buy Price ({sym})</label>
                <input className="form-control" type="number" name="buyPrice" value={form.buyPrice}
                  onChange={handleChange} placeholder="0.00" step="0.01" required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Sell Price ({sym})</label>
                <input className="form-control" type="number" name="sellPrice" value={form.sellPrice}
                  onChange={handleChange} placeholder="0.00" step="0.01" required min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-control" type="number" name="weightKg" value={form.weightKg}
                  onChange={handleChange} step="0.01" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Shipping Cost ({sym})</label>
                <input className="form-control" type="number" name="shippingCost" value={form.shippingCost}
                  onChange={handleChange} step="0.01" min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-control" type="number" name="quantity" value={form.quantity}
                  onChange={handleChange} min="1" />
              </div>
            </div>

            {form.countryCode === 'IN' && (
              <div className="form-group">
                <label className="form-label">GST Slab</label>
                <select className="form-control" name="gstSlab" value={form.gstSlab} onChange={handleChange}>
                  {GST_SLABS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Advertising Spend ({sym}/unit)</label>
              <input className="form-control" type="number" name="advertisingSpend" value={form.advertisingSpend}
                onChange={handleChange} step="0.01" min="0" />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isFBA" name="isFBA" checked={form.isFBA} onChange={handleChange} />
              <label htmlFor="isFBA" style={{ fontSize: 14, fontWeight: 500 }}>Using FBA (Fulfilled by Amazon)</label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="loader" /> : '⚡ Calculate Profit'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div>
            <div className="card">
              <h3 className="card-title">
                Profit: {result.country?.currencySymbol}{result.profit?.profitPerUnit}
                &nbsp;
                <span className={`badge badge-${result.profit?.profitRating?.rating === 'excellent' ? 'green' : result.profit?.profitRating?.rating === 'good' ? 'yellow' : result.profit?.profitRating?.rating === 'loss' ? 'red' : 'orange'}`}>
                  {result.profit?.profitRating?.emoji} {result.profit?.profitRating?.label}
                </span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Profit Margin', value: `${result.profit?.profitMargin}%` },
                  { label: 'ROI', value: `${result.profit?.roi}%` },
                  { label: 'Total Revenue', value: `${result.country?.currencySymbol}${result.bulk?.totalRevenue}` },
                  { label: 'Total Profit', value: `${result.country?.currencySymbol}${result.bulk?.totalProfit}` },
                  { label: 'Break-even Price', value: result.breakeven?.formattedBreakevenPrice },
                  { label: 'Tax Amount', value: `${result.country?.currencySymbol}${result.tax?.taxAmount} (${result.tax?.taxRate}%)` },
                ].map((item) => (
                  <div key={item.label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ fontWeight: 600, marginBottom: 10 }}>Amazon Fee Breakdown</h4>
              <div className="table-wrapper">
                <table>
                  <tbody>
                    {[
                      { label: 'Referral Fee', value: `${result.country?.currencySymbol}${result.amazonFees?.referralFee} (${result.amazonFees?.referralFeePercent}%)` },
                      { label: 'FBA Fulfillment', value: `${result.country?.currencySymbol}${result.amazonFees?.fulfillmentFee}` },
                      { label: 'Storage Fee', value: `${result.country?.currencySymbol}${result.amazonFees?.storageFee}` },
                      { label: 'Closing Fee', value: `${result.country?.currencySymbol}${result.amazonFees?.closingFee}` },
                      { label: 'Total Fees', value: `${result.country?.currencySymbol}${result.amazonFees?.totalFees}`, bold: true },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td style={{ fontWeight: row.bold ? 600 : 400 }}>{row.label}</td>
                        <td style={{ textAlign: 'right', fontWeight: row.bold ? 600 : 400 }}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
