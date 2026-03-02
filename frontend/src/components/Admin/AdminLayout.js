import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/admin/dashboard', label: '📊 Dashboard' },
  { path: '/admin/users', label: '👥 Users' },
  { path: '/admin/plans', label: '💎 Plans' },
  { path: '/admin/license-keys', label: '🔑 License Keys' },
  { path: '/admin/subscriptions', label: '📈 Subscriptions' },
  { path: '/admin/api-keys', label: '🛠️ API Keys' },
  { path: '/admin/settings', label: '⚙️ Settings' },
  { path: '/admin/logs', label: '📋 Logs' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#232f3e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #37475a' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FF9900' }}>🛒 Admin Panel</div>
          <div style={{ fontSize: 12, color: '#8eaec4', marginTop: 4 }}>Amazon Seller Toolkit</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive ? '#FF9900' : '#c8d6e5',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(255,153,0,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #FF9900' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          height: 56,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          gap: 16,
        }}>
          <span style={{ fontSize: 14, color: '#374151' }}>
            👤 <strong>{admin.username || 'Admin'}</strong>
          </span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13 }}>
            Logout
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, background: '#f3f4f6', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
