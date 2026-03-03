import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import { useCountry } from '../../context/CountryContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { currentCountry, countries, changeCountry } = useCountry();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.fullName
    ? user.fullName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email || 'U')[0].toUpperCase();

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <button style={styles.iconBtn} onClick={onToggleSidebar} title="Toggle Sidebar" aria-label="Toggle sidebar">
          <FiMenu size={20} />
        </button>
      </div>

      <div style={styles.right}>
        {/* Country Selector */}
        <select
          style={styles.countrySelect}
          value={currentCountry?.code || 'US'}
          onChange={(e) => changeCountry(e.target.value)}
          title="Switch marketplace"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag || ''} {c.code} – {c.currencyCode || c.currency}
            </option>
          ))}
        </select>

        {/* Theme Toggle */}
        <button style={styles.iconBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* User Avatar */}
        <div style={styles.avatar} title={user.fullName || user.email}>
          {initials}
        </div>

        {/* Sign Out */}
        <button style={styles.logoutBtn} onClick={handleLogout} title="Sign out">
          <FiLogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    padding: '0 20px',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    flexShrink: 0,
    zIndex: 100,
    position: 'sticky',
    top: 0,
    transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: {
    background: 'none',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    borderRadius: 8,
    cursor: 'pointer',
    padding: '7px 9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  countrySelect: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--gradient-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    cursor: 'default',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'none',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
};

