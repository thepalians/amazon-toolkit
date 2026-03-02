import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

export default function Dashboard() {
  const { currentCountry } = useCountry();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ products: 0, keywords: 0, optimizations: 0, trackedAsins: 0 });

  useEffect(() => {
    // Load stats in parallel
    Promise.all([
      api.get('/profit/history?limit=1').catch(() => ({ data: { products: [] } })),
      api.get('/keywords/history?limit=1').catch(() => ({ data: { keywords: [] } })),
      api.get('/listing/history?limit=1').catch(() => ({ data: { optimizations: [] } })),
      api.get('/competitor/list').catch(() => ({ data: { items: [] } })),
    ]).then(([profit, kw, listing, comp]) => {
      setStats({
        products: profit.data?.products?.length || 0,
        keywords: kw.data?.keywords?.length || 0,
        optimizations: listing.data?.optimizations?.length || 0,
        trackedAsins: comp.data?.items?.length || 0,
      });
    });
  }, []);

  const tools = [
    {
      path: '/profit',
      icon: '💰',
      label: 'Profit Calculator',
      desc: `Calculate FBA fees, VAT/GST and net profit for ${currentCountry?.name || 'your'} marketplace`,
      color: '#FF9900',
    },
    {
      path: '/keywords',
      icon: '🔍',
      label: 'Keyword Research',
      desc: 'Discover high-volume Amazon search terms from autocomplete suggestions',
      color: '#3b82f6',
    },
    {
      path: '/listing',
      icon: '🤖',
      label: 'AI Listing Optimizer',
      desc: 'Use Claude AI to create SEO-optimized titles, bullets and backend keywords',
      color: '#8b5cf6',
    },
    {
      path: '/competitor',
      icon: '👁️',
      label: 'Competitor Monitor',
      desc: 'Track competitor ASIN prices and get alerted on price drops',
      color: '#10b981',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Welcome back{user.fullName ? `, ${user.fullName}` : ''}! 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          Active marketplace: <strong>{currentCountry?.name}</strong> ({currentCountry?.currency || currentCountry?.currencyCode})
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Saved Products', value: stats.products, icon: '📦' },
          { label: 'Keywords Saved', value: stats.keywords, icon: '🔍' },
          { label: 'Optimizations', value: stats.optimizations, icon: '✨' },
          { label: 'Tracked ASINs', value: stats.trackedAsins, icon: '👁️' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Subscription Status */}
      <SubscriptionBanner />

      {/* Tools Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s', borderLeft: `4px solid ${tool.color}` }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{tool.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{tool.label}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{tool.desc}</p>
              <span style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: tool.color, fontWeight: 500 }}>
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SubscriptionBanner() {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/subscription/current').then((res) => setInfo(res.data)).catch(() => {});
    });
  }, []);

  if (!info) return null;
  const plan = info.plan || 'free';
  const planColors = { free: '#6b7280', basic: '#3b82f6', premium: '#8b5cf6', pro: '#FF9900', enterprise: '#FF9900' };
  const color = planColors[plan] || '#6b7280';

  return (
    <div style={{ marginBottom: 20, padding: '14px 20px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Current Plan: </span>
        <span style={{ fontWeight: 700, color, textTransform: 'capitalize', fontSize: 15 }}>{plan}</span>
        {info.subscription && (
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 12 }}>
            Expires: {new Date(info.subscription.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>
      {plan === 'free' && (
        <a href="/amazon-seller-toolkit/pricing" style={{ padding: '8px 18px', background: '#FF9900', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
          Upgrade Plan ↗
        </a>
      )}
    </div>
  );
}
