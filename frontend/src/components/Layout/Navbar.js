import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountry } from '../../context/CountryContext';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { currentCountry, countries, changeCountry } = useCountry();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <button style={styles.menuBtn} onClick={onToggleSidebar} title="Toggle Sidebar">
          ☰
        </button>
        <span style={styles.title}>🛒 Amazon Seller Toolkit</span>
      </div>
      <div style={styles.right}>
        <select
          style={styles.countrySelect}
          value={currentCountry?.code || 'US'}
          onChange={(e) => changeCountry(e.target.value)}
          title="Switch marketplace country"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag || ''} {c.code} – {c.currencyCode || c.currency}
            </option>
          ))}
        </select>
        <span style={styles.user}>👤 {user.fullName || user.email || 'Account'}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
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
    background: '#232f3e',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    flexShrink: 0,
    zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  title: { fontWeight: 700, fontSize: 16, color: '#FF9900' },
  countrySelect: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #4a5568',
    background: '#2d3748',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
  user: { fontSize: 13, color: '#d1d5db' },
  logoutBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #4a5568',
    background: 'transparent',
    color: '#d1d5db',
    fontSize: 13,
    cursor: 'pointer',
  },
};
