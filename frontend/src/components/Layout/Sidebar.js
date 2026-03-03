import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiGrid, FiDollarSign, FiSearch, FiEdit3, FiEye, FiCreditCard, FiShoppingCart, FiKey, FiCheckSquare, FiBell, FiPackage, FiTrendingUp, FiMessageSquare, FiBox, FiTruck, FiTarget, FiLayers, FiFileText, FiUsers, FiLink, FiBook, FiMessageCircle } from 'react-icons/fi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/profit', label: 'Profit Calculator', icon: FiDollarSign },
  { path: '/keywords', label: 'Keyword Research', icon: FiSearch },
  { path: '/listing', label: 'Listing Optimizer', icon: FiEdit3 },
  { path: '/competitor', label: 'Competitor Monitor', icon: FiEye },
  { path: '/pricing', label: 'Pricing', icon: FiCreditCard },
  { path: '/listing-score', label: 'Listing Score', icon: FiCheckSquare },
  { path: '/price-alerts', label: 'Price Alerts', icon: FiBell },
  { path: '/fba-fees', label: 'FBA Fee Breakdown', icon: FiPackage },
  { path: '/sales-estimator', label: 'Sales Estimator', icon: FiTrendingUp },
  { path: '/review-analyzer', label: 'Review Analyzer', icon: FiMessageSquare },
  { path: '/inventory', label: 'Inventory Forecast', icon: FiBox },
  { path: '/suppliers', label: 'Supplier Database', icon: FiTruck },
  { path: '/ppc', label: 'PPC Manager', icon: FiTarget },
  { path: '/ab-test', label: 'A/B Testing', icon: FiLayers },
  { path: '/financial', label: 'Financial Reports', icon: FiFileText },
  { path: '/teams', label: 'Teams', icon: FiUsers },
  { path: '/webhooks', label: 'Webhooks', icon: FiLink },
  { path: '/api-docs', label: 'API Docs', icon: FiBook },
  { path: '/chat', label: 'AI Assistant', icon: FiMessageCircle },
  { path: '/activate', label: 'Activate Key', icon: FiKey },
];

export default function Sidebar({ isOpen }) {
  return (
    <aside style={{
      ...styles.sidebar,
      width: isOpen ? 260 : 70,
      minWidth: isOpen ? 260 : 70,
    }}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <FiShoppingCart size={20} color="#FF9900" />
        </div>
        {isOpen && (
          <span style={styles.logoText}>
            <span style={{ color: '#FF9900' }}>Amazon</span> Toolkit
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={!isOpen ? item.label : undefined}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.active : {}),
                justifyContent: isOpen ? 'flex-start' : 'center',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div style={styles.footer}>
          <div style={styles.footerLinks}>
            <Link to="/terms" style={styles.footerLink}>Terms</Link>
            <span style={{ color: 'rgba(148,163,184,0.4)' }}>·</span>
            <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
          </div>
          <p style={styles.footerCopy}>© 2026 Palians</p>
        </div>
      )}
    </aside>
  );
}

const styles = {
  sidebar: {
    background: 'var(--gradient-sidebar)',
    color: '#e2e8f0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease, min-width 0.3s ease',
    overflow: 'hidden',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    minHeight: 64,
    overflow: 'hidden',
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(255,153,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255,153,0,0.2)',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
    whiteSpace: 'nowrap',
  },
  nav: {
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'var(--sidebar-text)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    borderLeft: '3px solid transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  active: {
    background: 'rgba(255,153,0,0.12)',
    color: '#FF9900',
    borderLeft: '3px solid #FF9900',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  footerLink: {
    color: 'var(--sidebar-text)',
    fontSize: 11,
    textDecoration: 'none',
    opacity: 0.8,
  },
  footerCopy: {
    color: 'var(--sidebar-text)',
    fontSize: 11,
    opacity: 0.6,
  },
};

