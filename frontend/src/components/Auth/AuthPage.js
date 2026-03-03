import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiShoppingCart } from 'react-icons/fi';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { countries, changeCountry } = useCountry();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', countryCode: 'US' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, fullName: form.fullName, countryCode: form.countryCode };

      const res = await api.post(endpoint, payload);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      changeCountry(user.countryCode || 'US');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #FF9900, #ff6600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiShoppingCart size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Amazon <span style={{ color: '#FF9900' }}>Seller</span> Toolkit
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={inputWrap}>
                <FiUser size={16} style={inputIcon} />
                <input
                  className="form-control"
                  style={inputStyle}
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={inputWrap}>
              <FiMail size={16} style={inputIcon} />
              <input
                className="form-control"
                style={inputStyle}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={inputWrap}>
              <FiLock size={16} style={inputIcon} />
              <input
                className="form-control"
                style={inputStyle}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Your Country / Marketplace</label>
              <select
                className="form-control"
                name="countryCode"
                value={form.countryCode}
                onChange={handleChange}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag || ''} {c.name} ({c.currency || c.currencyCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 20px', fontSize: 15, fontWeight: 700 }}
          >
            {loading ? <span className="loader" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/register" style={{ color: '#FF9900', fontWeight: 600 }}>Register</Link></>
          ) : (
            <>Already have an account? <Link to="/login" style={{ color: '#FF9900', fontWeight: 600 }}>Sign In</Link></>
          )}
        </p>

        {mode === 'register' && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
            By registering, you agree to our{' '}
            <Link to="/terms" style={{ color: '#FF9900' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#FF9900' }}>Privacy Policy</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const inputWrap = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIcon = { position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' };
const inputStyle = { paddingLeft: 38 };

