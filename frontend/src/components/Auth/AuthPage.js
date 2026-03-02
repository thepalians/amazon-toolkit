import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
          <h1>🛒 Amazon <span>Seller</span> Toolkit</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: 6 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
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

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? <span className="loader" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '14px', color: '#6b7280' }}>
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/register" style={{ color: '#FF9900' }}>Register</Link></>
          ) : (
            <>Already have an account? <Link to="/login" style={{ color: '#FF9900' }}>Sign In</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
