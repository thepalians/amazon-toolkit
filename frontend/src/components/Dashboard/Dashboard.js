import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiSearch, FiStar, FiEye, FiDollarSign, FiEdit3, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

const statCards = (stats) => [
  { label: 'Saved Products', value: stats.products, icon: FiPackage, color: '#FF9900', bg: 'rgba(255,153,0,0.12)' },
  { label: 'Keywords Saved', value: stats.keywords, icon: FiSearch, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { label: 'Optimizations', value: stats.optimizations, icon: FiStar, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { label: 'Tracked ASINs', value: stats.trackedAsins, icon: FiEye, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
];

export default function Dashboard() {
  const { currentCountry } = useCountry();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ products: 0, keywords: 0, optimizations: 0, trackedAsins: 0 });

  useEffect(() => {
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
      icon: FiDollarSign,
      label: 'Profit Calculator',
      desc: `Calculate FBA fees, VAT/GST and net profit for ${currentCountry?.name || 'your'} marketplace`,
      color: '#FF9900',
      bg: 'rgba(255,153,0,0.1)',
    },
    {
      path: '/keywords',
      icon: FiSearch,
      label: 'Keyword Research',
      desc: 'Discover high-volume Amazon search terms from autocomplete suggestions',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    {
      path: '/listing',
      icon: FiEdit3,
      label: 'AI Listing Optimizer',
      desc: 'Use Claude AI to create SEO-optimized titles, bullets and backend keywords',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
    },
    {
      path: '/competitor',
      icon: FiEye,
      label: 'Competitor Monitor',
      desc: 'Track competitor ASIN prices and get alerted on price drops',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
  ];

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
          Welcome back{user.fullName ? `, ${user.fullName}` : ''}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
            {currentCountry?.flag} {currentCountry?.name}
          </span>
          <span style={{ fontSize: 13 }}>{currentCountry?.currency || currentCountry?.currencyCode}</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards(stats).map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card slide-up" style={{ padding: 20, margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Status */}
      <SubscriptionBanner />

      {/* Tools Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{ cursor: 'pointer', margin: 0, borderLeft: `4px solid ${tool.color}`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={22} color={tool.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{tool.label}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tool.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 13, color: tool.color, fontWeight: 600 }}>
                  Open <FiArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
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
    <div className="card" style={{
      marginBottom: 20,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FiTrendingUp size={18} color={color} />
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Current Plan:</span>
        <span style={{ fontWeight: 700, color, textTransform: 'capitalize', fontSize: 14,
          background: `${color}20`, padding: '2px 10px', borderRadius: 99 }}>{plan}</span>
        {info.subscription && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Expires: {new Date(info.subscription.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>
      {plan === 'free' && (
        <Link to="/pricing" style={{ padding: '7px 16px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
          Upgrade Plan →
        </Link>
      )}
    </div>
  );
}
