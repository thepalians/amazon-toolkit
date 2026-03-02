import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

export default function ListingOptimizer() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [form, setForm] = useState({
    title: '',
    description: '',
    bulletsText: '',
    keywordsText: '',
    category: 'general',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const bullets = form.bulletsText.split('\n').map((b) => b.trim()).filter(Boolean);
      const keywords = form.keywordsText.split(',').map((k) => k.trim()).filter(Boolean);

      const res = await api.post('/listing/optimize', {
        title: form.title,
        description: form.description,
        bullets,
        keywords,
        category: form.category,
        countryCode: selectedCountry,
      });
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError('AI service not configured. Please set the CLAUDE_API_KEY on the server.');
      } else {
        setError(err.response?.data?.message || 'Optimization failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Brief visual feedback could go here; browser native clipboard API success
    }).catch(() => {
      // Fallback: create a temporary textarea
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🤖 AI Listing Optimizer</h2>
      <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
        Powered by Claude AI — optimizes your Amazon listing for {currentCountry?.name} marketplace
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Input form */}
        <div className="card">
          <h3 className="card-title">Original Listing</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marketplace</label>
                <select
                  className="form-control"
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-control" type="text" name="category" value={form.category} onChange={handleChange} placeholder="electronics, home, etc." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Title</label>
              <input className="form-control" type="text" name="title" value={form.title} onChange={handleChange} placeholder="Current product title..." required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Current product description..." style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Bullet Points (one per line)</label>
              <textarea className="form-control" name="bulletsText" value={form.bulletsText} onChange={handleChange} rows={5} placeholder="Feature one&#10;Feature two&#10;Feature three" style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Target Keywords (comma-separated)</label>
              <input className="form-control" type="text" name="keywordsText" value={form.keywordsText} onChange={handleChange} placeholder="wireless earbuds, bluetooth headphones, noise cancelling..." />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? (
                <><span className="loader" /> &nbsp; Optimizing with AI...</>
              ) : '✨ Optimize Listing'}
            </button>
          </form>
        </div>

        {/* Optimized result */}
        {result && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Optimized Listing</h3>
              <span className="badge badge-green">Score: {result.optimizationScore}/100</span>
            </div>

            <Section title="Optimized Title" content={result.optimizedTitle} onCopy={() => copyToClipboard(result.optimizedTitle)} />
            <Section title="Optimized Description" content={result.optimizedDescription} onCopy={() => copyToClipboard(result.optimizedDescription)} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Bullet Points</label>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => copyToClipboard(result.optimizedBullets.join('\n'))}>📋 Copy</button>
              </div>
              <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
                {result.optimizedBullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Backend Keywords</label>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => copyToClipboard(result.backendKeywords.join(' '))}>📋 Copy</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.backendKeywords.map((k, i) => (
                  <span key={i} className="badge badge-blue">{k}</span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
              Model: {result.aiModel} | Language: {result.language} | Tokens: {result.tokensUsed}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content, onCopy }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{title}</label>
        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={onCopy}>📋 Copy</button>
      </div>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 14, lineHeight: 1.6, border: '1px solid #e5e7eb' }}>
        {content}
      </div>
    </div>
  );
}
