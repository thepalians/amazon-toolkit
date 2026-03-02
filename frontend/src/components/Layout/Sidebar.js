import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/profit', label: 'Profit Calculator', icon: '💰' },
  { path: '/keywords', label: 'Keyword Research', icon: '🔍' },
  { path: '/listing', label: 'Listing Optimizer', icon: '🤖' },
  { path: '/competitor', label: 'Competitor Monitor', icon: '👁️' },
];

export default function Sidebar({ isOpen }) {
  if (!isOpen) return null;

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.active : {}),
            })}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 230,
    background: '#1a202c',
    color: '#e2e8f0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#a0aec0',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
  },
  active: {
    background: '#FF9900',
    color: '#fff',
  },
  icon: { fontSize: 18 },
};
