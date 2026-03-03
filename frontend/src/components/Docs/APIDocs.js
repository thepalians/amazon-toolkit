import React, { useState } from 'react';

const API_BASE = 'https://palians.com/amazon-seller-toolkit/api';

const ENDPOINTS = [
  {
    category: 'Authentication',
    icon: '🔐',
    routes: [
      { method: 'POST', path: '/auth/register', desc: 'Register new user', body: '{ fullName, email, password }' },
      { method: 'POST', path: '/auth/login', desc: 'Login and get JWT token', body: '{ email, password }' },
    ],
  },
  {
    category: 'Profit Calculator',
    icon: '💰',
    routes: [
      { method: 'POST', path: '/profit/calculate', desc: 'Calculate profit for a product', body: '{ asin, countryCode, buyPrice, sellPrice }', auth: true },
      { method: 'GET', path: '/profit/history', desc: 'Get calculation history', auth: true },
    ],
  },
  {
    category: 'Keyword Research',
    icon: '🔍',
    routes: [
      { method: 'POST', path: '/keywords/search', desc: 'Get keyword suggestions', body: '{ keyword, countryCode }', auth: true },
      { method: 'GET', path: '/keywords/history', desc: 'Get search history', auth: true },
    ],
  },
  {
    category: 'Listing Optimizer',
    icon: '✍️',
    routes: [
      { method: 'POST', path: '/listing/optimize', desc: 'AI-optimize listing with Claude', body: '{ asin, keywords, countryCode }', auth: true },
    ],
  },
  {
    category: 'Competitor Monitor',
    icon: '👁️',
    routes: [
      { method: 'POST', path: '/competitor/track', desc: 'Start tracking an ASIN', body: '{ asin, countryCode }', auth: true },
      { method: 'GET', path: '/competitor/list', desc: 'List tracked ASINs', auth: true },
      { method: 'POST', path: '/competitor/check/:id', desc: 'Check price now', auth: true },
    ],
  },
  {
    category: 'Price Alerts',
    icon: '🔔',
    routes: [
      { method: 'POST', path: '/alerts/create', desc: 'Create price alert', body: '{ tracking_id, alert_type, target_price }', auth: true },
      { method: 'GET', path: '/alerts/list', desc: 'List all alerts', auth: true },
      { method: 'GET', path: '/alerts/notifications', desc: 'Get notifications', auth: true },
    ],
  },
  {
    category: 'Listing Score',
    icon: '📊',
    routes: [
      { method: 'POST', path: '/listing-score/analyze', desc: 'Analyze listing quality', body: '{ asin, countryCode }', auth: true },
    ],
  },
  {
    category: 'FBA Fees',
    icon: '📦',
    routes: [
      { method: 'POST', path: '/fba-fees/calculate', desc: 'Calculate FBA fees', body: '{ asin, countryCode, price, weight, dimensions }', auth: true },
    ],
  },
  {
    category: 'Sales Estimator',
    icon: '📈',
    routes: [
      { method: 'POST', path: '/sales-estimator/estimate', desc: 'Estimate sales from BSR', body: '{ bsr, category, countryCode, price }', auth: true },
      { method: 'GET', path: '/sales-estimator/categories/:cc', desc: 'Get categories for marketplace', auth: true },
      { method: 'POST', path: '/sales-estimator/bulk', desc: 'Bulk BSR estimate (max 20)', body: '{ items: [...], countryCode }', auth: true },
    ],
  },
  {
    category: 'Review Analyzer',
    icon: '⭐',
    routes: [
      { method: 'POST', path: '/reviews/analyze', desc: 'Analyze product reviews', body: '{ asin, countryCode, maxPages }', auth: true },
    ],
  },
  {
    category: 'Inventory',
    icon: '📦',
    routes: [
      { method: 'GET', path: '/inventory/list', desc: 'List inventory with forecasts', auth: true },
      { method: 'POST', path: '/inventory/add', desc: 'Add inventory item', body: '{ asin, current_stock, daily_sales, ... }', auth: true },
      { method: 'POST', path: '/inventory/restock/:id', desc: 'Restock item', body: '{ quantity }', auth: true },
    ],
  },
  {
    category: 'PPC Campaigns',
    icon: '🎯',
    routes: [
      { method: 'GET', path: '/ppc/campaigns', desc: 'List all campaigns', auth: true },
      { method: 'POST', path: '/ppc/campaigns', desc: 'Create campaign', body: '{ campaign_name, campaign_type, daily_budget, ... }', auth: true },
      { method: 'POST', path: '/ppc/keywords', desc: 'Add keywords to campaign', body: '{ campaign_id, keyword, match_type, bid, ... }', auth: true },
      { method: 'GET', path: '/ppc/optimizer/:id', desc: 'Get AI optimization suggestions', auth: true },
    ],
  },
  {
    category: 'Financial',
    icon: '💰',
    routes: [
      { method: 'GET', path: '/financial/records', desc: 'Get financial records', auth: true },
      { method: 'POST', path: '/financial/add', desc: 'Add record', body: '{ record_date, record_type, amount, ... }', auth: true },
      { method: 'GET', path: '/financial/monthly-summary', desc: 'Monthly P&L summary', auth: true },
    ],
  },
  {
    category: 'Webhooks',
    icon: '🔗',
    routes: [
      { method: 'GET', path: '/webhooks/list', desc: 'List webhooks', auth: true },
      { method: 'POST', path: '/webhooks/create', desc: 'Create webhook', body: '{ webhook_name, webhook_url, platform, events }', auth: true },
      { method: 'POST', path: '/webhooks/test/:id', desc: 'Test webhook', auth: true },
    ],
  },
];

const METHOD_COLORS = { GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444' };

export default function APIDocs() {
  const [expandedCat, setExpandedCat] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search
    ? ENDPOINTS.map(cat => ({
        ...cat,
        routes: cat.routes.filter(r =>
          r.path.toLowerCase().includes(search.toLowerCase()) ||
          r.desc.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.routes.length > 0)
    : ENDPOINTS;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📚 API Documentation</h2>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          REST API endpoints for Amazon Seller Toolkit
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 12 }}>
          <span style={{ padding: '4px 10px', borderRadius: 8, background: '#f3f4f6', fontFamily: 'monospace' }}>
            Base URL: {API_BASE}
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 8, background: '#fef3c7', color: '#92400e' }}>
            Auth: Bearer Token (JWT)
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '10px 14px' }}>
        <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search endpoints... e.g. /profit, BSR, keywords" />
      </div>

      {/* Auth Example */}
      <div className="card" style={{ marginBottom: 16, background: '#fef3c7', border: '1px solid #fcd34d' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>🔐 Authentication</div>
        <pre style={{ fontSize: 11, color: '#78350f', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
{`// Include in all authenticated requests:
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}`}
        </pre>
      </div>

      {filtered.map((cat, ci) => (
        <div key={ci} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: expandedCat === ci ? 'var(--accent-light)' : 'transparent',
          }} onClick={() => setExpandedCat(expandedCat === ci ? null : ci)}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{cat.icon} {cat.category}</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{cat.routes.length} endpoints {expandedCat === ci ? '▲' : '▼'}</span>
          </div>

          {expandedCat === ci && (
            <div style={{ padding: '0 16px 14px' }}>
              {cat.routes.map((r, ri) => (
                <div key={ri} style={{ padding: '10px 0', borderBottom: ri < cat.routes.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#fff',
                      background: METHOD_COLORS[r.method],
                    }}>{r.method}</span>
                    <code style={{ fontSize: 12, fontWeight: 600 }}>{r.path}</code>
                    {r.auth && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>🔒 Auth</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{r.desc}</p>
                  {r.body && (
                    <pre style={{ fontSize: 10, color: '#6b7280', background: '#f9fafb', padding: '6px 10px', borderRadius: 6, marginTop: 4, fontFamily: 'monospace' }}>
                      Body: {r.body}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="card" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
        Total: {ENDPOINTS.reduce((s, c) => s + c.routes.length, 0)} endpoints across {ENDPOINTS.length} categories
      </div>
    </div>
  );
}
