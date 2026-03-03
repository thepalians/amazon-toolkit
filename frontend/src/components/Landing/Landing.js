import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TOOLS = [
  { icon: '💰', name: 'Profit Calculator', desc: 'Calculate FBA fees, VAT/GST and net profit for any product', color: '#FF9900' },
  { icon: '🔍', name: 'Keyword Research', desc: 'Discover high-volume Amazon search terms', color: '#3b82f6' },
  { icon: '✍️', name: 'AI Listing Optimizer', desc: 'Claude AI creates SEO-optimized listings', color: '#8b5cf6' },
  { icon: '👁️', name: 'Competitor Monitor', desc: 'Track competitor prices and get alerts', color: '#10b981' },
  { icon: '📊', name: 'Listing Score', desc: 'Score your listing quality out of 100', color: '#ec4899' },
  { icon: '🔔', name: 'Price Alerts', desc: 'Get notified when prices drop or rise', color: '#ef4444' },
  { icon: '📦', name: 'FBA Fee Breakdown', desc: 'Detailed FBA fee calculator by category', color: '#f59e0b' },
  { icon: '📈', name: 'Sales Estimator', desc: 'Estimate monthly sales from BSR rank', color: '#06b6d4' },
  { icon: '⭐', name: 'Review Analyzer', desc: 'Sentiment analysis on product reviews', color: '#f97316' },
  { icon: '📦', name: 'Inventory Forecast', desc: 'Predict stockouts and reorder timing', color: '#22c55e' },
  { icon: '🏭', name: 'Supplier Database', desc: 'Manage suppliers from Alibaba, IndiaMart', color: '#6366f1' },
  { icon: '🎯', name: 'PPC Manager', desc: 'Manage campaigns with AI optimization', color: '#dc2626' },
  { icon: '🧪', name: 'A/B Testing', desc: 'Test titles, images and track winners', color: '#7c3aed' },
  { icon: '💰', name: 'Financial Reports', desc: 'P&L tracking with monthly summaries', color: '#059669' },
  { icon: '👥', name: 'Team Collaboration', desc: 'Invite team members with roles', color: '#2563eb' },
  { icon: '🔗', name: 'Webhook Alerts', desc: 'Send alerts to Slack, Discord, Teams', color: '#4f46e5' },
  { icon: '📄', name: 'Export CSV/PDF', desc: 'Export any data as CSV or PDF', color: '#0891b2' },
  { icon: '📧', name: 'Email Notifications', desc: 'Get email alerts for price changes', color: '#be185d' },
  { icon: '📚', name: 'API Documentation', desc: '30+ REST API endpoints', color: '#78716c' },
  { icon: '🧩', name: 'Chrome Extension', desc: 'Quick ASIN lookup on Amazon pages', color: '#ea580c' },
];

const MARKETS = [
  { flag: '🇺🇸', name: 'USA' }, { flag: '🇮🇳', name: 'India' },
  { flag: '🇬🇧', name: 'UK' }, { flag: '🇦🇪', name: 'UAE' },
  { flag: '🇩🇪', name: 'Germany' }, { flag: '🇫🇷', name: 'France' },
  { flag: '🇨🇦', name: 'Canada' }, { flag: '🇦🇺', name: 'Australia' },
  { flag: '🇯🇵', name: 'Japan' },
];

const STATS = [
  { value: '20+', label: 'Tools' },
  { value: '9', label: 'Marketplaces' },
  { value: '30+', label: 'API Endpoints' },
  { value: 'Free', label: 'To Start' },
];

export default function Landing() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#FF9900' }}>🛒 Amazon Seller Toolkit</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{ padding: '8px 20px', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Login</Link>
          <Link to="/register" style={{ padding: '8px 20px', borderRadius: 8, background: '#FF9900', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Get Started Free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: '60px 20px 40px', maxWidth: 800, margin: '0 auto',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease',
      }}>
        <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, background: 'rgba(255,153,0,0.15)', color: '#FF9900', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          20+ Tools for Amazon Sellers
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Everything You Need to{' '}
          <span style={{ background: 'linear-gradient(135deg, #FF9900, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dominate Amazon
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, marginBottom: 30 }}>
          Profit Calculator, AI Listing Optimizer, PPC Manager, Review Analyzer, Inventory Forecasting — all in one powerful toolkit. Free to start.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/register" style={{ padding: '14px 32px', borderRadius: 12, background: '#FF9900', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 20px rgba(255,153,0,0.4)' }}>
            Start Free →
          </Link>
          <Link to="/api-docs" style={{ padding: '14px 32px', borderRadius: 12, border: '2px solid #334155', color: '#94a3b8', textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>
            API Docs
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '30px 20px', flexWrap: 'wrap' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FF9900' }}>{s.value}</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Marketplaces */}
      <section style={{ textAlign: 'center', padding: '20px 20px 40px' }}>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>SUPPORTED MARKETPLACES</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {MARKETS.map((m, i) => (
            <div key={i} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 13 }}>
              {m.flag} {m.name}
            </div>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 10 }}>All Tools</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 40 }}>Everything you need — from research to scaling</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {TOOLS.map((tool, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 20, transition: 'all 0.3s',
              borderLeft: `4px solid ${tool.color}`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <span style={{ fontSize: 28 }}>{tool.icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>{tool.name}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(135deg, rgba(255,153,0,0.1), rgba(139,92,246,0.1))' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to Scale Your Amazon Business?</h2>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 24 }}>Join thousands of sellers using Amazon Seller Toolkit</p>
        <Link to="/register" style={{
          display: 'inline-block', padding: '16px 40px', borderRadius: 12,
          background: '#FF9900', color: '#fff', textDecoration: 'none',
          fontSize: 18, fontWeight: 700, boxShadow: '0 4px 20px rgba(255,153,0,0.4)',
        }}>
          Get Started Free →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '30px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 14, color: '#64748b' }}>
          &copy; {new Date().getFullYear()} <a href="https://palians.com" style={{ color: '#FF9900', textDecoration: 'none' }}>Palians</a> — Amazon Seller Toolkit v4.2
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10, fontSize: 12, color: '#475569' }}>
          <Link to="/login" style={{ color: '#475569', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: '#475569', textDecoration: 'none' }}>Register</Link>
          <Link to="/api-docs" style={{ color: '#475569', textDecoration: 'none' }}>API Docs</Link>
          <a href="https://github.com/thepalians/amazon-toolkit" target="_blank" rel="noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
