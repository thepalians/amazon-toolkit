import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { FiGrid, FiUsers, FiAward, FiKey, FiTrendingUp, FiTool, FiSettings, FiList, FiShoppingCart, FiLogOut, FiUser } from 'react-icons/fi';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/admin/users', label: 'Users', icon: FiUsers },
  { path: '/admin/plans', label: 'Plans', icon: FiAward },
  { path: '/admin/license-keys', label: 'License Keys', icon: FiKey },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: FiTrendingUp },
  { path: '/admin/api-keys', label: 'API Keys', icon: FiTool },
  { path: '/admin/settings', label: 'Settings', icon: FiSettings },
  { path: '/admin/logs', label: 'Logs', icon: FiList },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--gradient-sidebar)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,153,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiShoppingCart size={18} color="#FF9900" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FF9900' }}>Admin Panel</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Amazon Seller Toolkit</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  borderRadius: 8,
                  color: isActive ? '#FF9900' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(255,153,0,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #FF9900' : '3px solid transparent',
                  transition: 'all 0.15s',
                  marginBottom: 2,
                })}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          height: 56,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          gap: 14,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUser size={14} color="#fff" />
            </div>
            <strong style={{ color: 'var(--text-primary)' }}>{admin.username || 'Admin'}</strong>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiLogOut size={14} /> Logout
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, background: 'var(--bg-primary)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
