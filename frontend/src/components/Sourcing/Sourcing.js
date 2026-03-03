import React, { useState } from 'react';
import api from '../../services/api';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const SOURCES = ['China', 'India', 'Vietnam', 'Bangladesh', 'Thailand', 'Turkey', 'Pakistan'];
const DESTINATIONS = ['US', 'UK', 'IN', 'AE', 'DE', 'FR', 'CA', 'AU', 'JP'];
const METHODS = { sea: '🚢 Sea (25-45 days)', air: '✈️ Air (7-14 days)', express: '⚡ Express (3-7 days)' };

export default function Sourcing() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: '', source_country: 'China', destination_country: 'US',
    unit_cost: '', units_per_order: '500', shipping_method: 'sea',
    weight_per_unit: '0.5', customs_duty_percent: '5',
    amazon_referral_percent: '15', fba_fee_per_unit: '5',
    target_sell_price: '',
  });

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/sourcing/calculate', form);
      setResult(res.data.calculation);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const r = result;
  const exportColumns = [
    { label: 'Field', accessor: 'field' },
    { label: 'Value', accessor: 'value' },
  ];
  const exportData = r ? [
    { field: 'Product', value: r.product_name },
    { field: 'Unit Cost', value: `$${r.costBreakdown.unitCost}` },
    { field: 'Shipping/Unit', value: `$${r.costBreakdown.shippingPerUnit}` },
    { field: 'Duty/Unit', value: `$${r.costBreakdown.dutyPerUnit}` },
    { field: 'Landed Cost', value: `$${r.costBreakdown.totalLandedCost}` },
    { field: 'Sell Price', value: `$${r.profitability.sellPrice}` },
    { field: 'Profit/Unit', value: `$${r.profitability.profitPerUnit}` },
    { field: 'Margin', value: `${r.profitability.profitMargin}%` },
    { field: 'ROI', value: `${r.profitability.roi}%` },
    { field: 'Total Investment', value: `$${r.orderSummary.totalInvestment}` },
    { field: 'Total Profit', value: `$${r.orderSummary.totalProfit}` },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🌏 Product Sourcing Calculator</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Calculate landed cost, profit margins and ROI for sourced products</p>
        </div>
        {r && (
          <ExportButton
            onCSV={() => exportToCSV(exportData, exportColumns, 'sourcing')}
            onPDF={() => exportToPDF(exportData, exportColumns, 'sourcing', `Sourcing: ${r.product_name}`)}
          />
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleCalc}>
          <div className="form-row">
            <div className="form-group" style={{flex:2}}><label className="form-label">Product Name</label>
              <input className="form-control" value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} placeholder="e.g. Silicone Kitchen Tongs" /></div>
            <div className="form-group"><label className="form-label">Source</label>
              <select className="form-control" value={form.source_country} onChange={(e) => setForm({...form, source_country: e.target.value})}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Destination</label>
              <select className="form-control" value={form.destination_country} onChange={(e) => setForm({...form, destination_country: e.target.value})}>
                {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Unit Cost ($)</label>
              <input className="form-control" type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({...form, unit_cost: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Order Qty</label>
              <input className="form-control" type="number" value={form.units_per_order} onChange={(e) => setForm({...form, units_per_order: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Weight/Unit (kg)</label>
              <input className="form-control" type="number" step="0.1" value={form.weight_per_unit} onChange={(e) => setForm({...form, weight_per_unit: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Shipping</label>
              <select className="form-control" value={form.shipping_method} onChange={(e) => setForm({...form, shipping_method: e.target.value})}>
                {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Customs Duty (%)</label>
              <input className="form-control" type="number" step="0.1" value={form.customs_duty_percent} onChange={(e) => setForm({...form, customs_duty_percent: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Amazon Referral (%)</label>
              <input className="form-control" type="number" step="0.1" value={form.amazon_referral_percent} onChange={(e) => setForm({...form, amazon_referral_percent: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">FBA Fee/Unit ($)</label>
              <input className="form-control" type="number" step="0.01" value={form.fba_fee_per_unit} onChange={(e) => setForm({...form, fba_fee_per_unit: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Sell Price ($)</label>
              <input className="form-control" type="number" step="0.01" value={form.target_sell_price} onChange={(e) => setForm({...form, target_sell_price: e.target.value})} required /></div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Calculating...' : '🌏 Calculate Sourcing Cost'}
          </button>
        </form>
      </div>

      {r && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Landed Cost', value: `$${r.costBreakdown.totalLandedCost}`, color: '#3b82f6', icon: '📦' },
              { label: 'Total Cost/Unit', value: `$${r.costBreakdown.totalCostPerUnit}`, color: '#ef4444', icon: '💸' },
              { label: 'Profit/Unit', value: `$${r.profitability.profitPerUnit}`, color: r.profitability.profitPerUnit >= 0 ? '#22c55e' : '#ef4444', icon: '💰' },
              { label: 'Margin', value: `${r.profitability.profitMargin}%`, color: r.profitability.profitMargin >= 20 ? '#22c55e' : '#f59e0b', icon: '📊' },
              { label: 'ROI', value: `${r.profitability.roi}%`, color: r.profitability.roi >= 50 ? '#22c55e' : '#f59e0b', icon: '📈' },
              { label: 'Delivery', value: r.shipping.estimatedDays, color: '#6b7280', icon: '🚚' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 14, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 className="card-title">📦 Cost Breakdown</h3>
              {[
                ['Unit Cost', `$${r.costBreakdown.unitCost}`],
                ['Shipping/Unit', `$${r.costBreakdown.shippingPerUnit}`],
                ['Customs Duty', `$${r.costBreakdown.dutyPerUnit}`],
                ['Landed Cost', `$${r.costBreakdown.totalLandedCost}`],
                ['Referral Fee', `$${r.costBreakdown.referralFee}`],
                ['FBA Fee', `$${r.costBreakdown.fbaFee}`],
                ['Total Cost', `$${r.costBreakdown.totalCostPerUnit}`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ fontWeight: i === 6 ? 800 : 600, color: i === 6 ? '#ef4444' : 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="card-title">💰 Order Summary</h3>
              {[
                ['Order Quantity', `${r.orderSummary.units} units`],
                ['Total Investment', `$${r.orderSummary.totalInvestment.toLocaleString()}`],
                ['Total Revenue', `$${r.orderSummary.totalRevenue.toLocaleString()}`],
                ['Total Profit', `$${r.orderSummary.totalProfit.toLocaleString()}`],
                ['Break-even', `${r.orderSummary.breakEvenUnits} units`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: i === 3 ? (r.orderSummary.totalProfit >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
