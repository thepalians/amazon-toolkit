import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiSearch, FiStar, FiEye, FiDollarSign, FiEdit3,
  FiArrowRight, FiTrendingUp, FiBell, FiCheckSquare, FiActivity,
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

const COLORS = ['#FF9900', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const { currentCountry } = useCountry();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/dashboard/price-trends').catch(() => ({ data: { trends: [] } })),
        api.get('/dashboard/recent-activity').catch(() => ({ data: { activity: [] } })),
      ]);
      setStats(statsRes.data.stats || {});
      setTrends(trendsRes.data.trends || []);
      setActivity(activityRes.data.activity || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Tracked ASINs', value: stats?.trackedAsins || 0, icon: FiEye, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Price Checks', value: stats?.totalPriceChecks || 0, icon: FiActivity, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Active Alerts', value: stats?.activeAlerts || 0, icon: FiBell, color: '#FF9900', bg: 'rgba(255,153,0,0.12)' },
    { label: 'Alerts Triggered', value: stats?.triggeredAlerts || 0, icon: FiCheckSquare, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Unread', value: stats?.unreadNotifications || 0, icon: FiBell, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const tools = [
    { path: '/profit', icon: FiDollarSign, label: 'Profit Calculator', desc: 'Calculate FBA fees and net profit', color: '#FF9900', bg: 'rgba(255,153,0,0.1)' },
    { path: '/keywords', icon: FiSearch, label: 'Keyword Research', desc: 'Amazon search term suggestions', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { path: '/listing', icon: FiEdit3, label: 'AI Listing Optimizer', desc: 'AI-powered listing optimization', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { path: '/competitor', icon: FiEye, label: 'Competitor Monitor', desc: 'Track competitor prices', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { path: '/fba-fees', icon: FiPackage, label: 'FBA Fee Breakdown', desc: 'Detailed fee calculator', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { path: '/sales-estimator', icon: FiTrendingUp, label: 'Sales Estimator', desc: 'BSR to sales estimation', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { path: '/listing-score', icon: FiCheckSquare, label: 'Listing Score', desc: 'Analyze listing quality', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { path: '/price-alerts', icon: FiBell, label: 'Price Alerts', desc: 'Get notified on price changes', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  // Prepare chart data from trends
  const chartData = [];
  if (trends.length > 0) {
    const maxLen = Math.max(...trends.map(t => t.data.length));
    for (let i = 0; i < maxLen; i++) {
      const point = {};
      trends.forEach((t, idx) => {
        if (t.data[i]) {
          point.date = new Date(t.data[i].date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
          point[t.asin] = t.data[i].price;
        }
      });
      if (point.date) chartData.push(point);
    }
  }

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
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

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card slide-up" style={{ padding: 18, margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Banner */}
      <SubscriptionBanner />

      {/* Charts + Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Price Trends Chart */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiTrendingUp size={18} color="#FF9900" /> Price Trends
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {trends.map((t, idx) => (
                  <Line key={t.asin} type="monotone" dataKey={t.asin} name={t.asin}
                    stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3 }}
                    activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: 8 }}>
              <FiTrendingUp size={40} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No price data yet</p>
              <Link to="/competitor" style={{ fontSize: 13, color: '#FF9900', fontWeight: 600 }}>
                Start tracking ASINs →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: 20, maxHeight: 380, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiActivity size={18} color="#3b82f6" /> Recent Activity
          </h3>
          {activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.map((a, i) => (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: i < activity.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 16, marginTop: 2 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.message}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                        {new Date(a.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
              <p style={{ fontSize: 14 }}>No activity yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Use tools to see activity here</p>
            </div>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>🛠️ Quick Access Tools</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.path} to={tool.path} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                cursor: 'pointer', margin: 0, padding: '16px 18px',
                borderLeft: `4px solid ${tool.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={tool.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{tool.label}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{tool.desc}</p>
                  </div>
                  <FiArrowRight size={14} color={tool.color} />
                </div>
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
    api.get('/subscription/current').then((res) => setInfo(res.data)).catch(() => {});
  }, []);

  if (!info) return null;
  const plan = info.plan || 'free';
  const planColors = { free: '#6b7280', basic: '#3b82f6', premium: '#8b5cf6', pro: '#FF9900', enterprise: '#FF9900' };
  const color = planColors[plan] || '#6b7280';

  return (
    <div className="card" style={{
      marginBottom: 20, padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
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
