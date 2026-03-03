import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const SENTIMENT_COLORS = { positive: '#22c55e', negative: '#ef4444', neutral: '#f59e0b' };
const RATING_COLORS = { 5: '#22c55e', 4: '#84cc16', 3: '#f59e0b', 2: '#f97316', 1: '#ef4444' };

export default function ReviewAnalyzer() {
  const { countryCode, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [asin, setAsin] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!asin.trim()) return;
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await api.post('/reviews/analyze', { asin: asin.trim().toUpperCase(), countryCode: selectedCountry, maxPages: 3 });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed.');
    } finally { setLoading(false); }
  };

  // Export
  const exportColumns = [
    { label: 'Rating', accessor: 'rating' },
    { label: 'Sentiment', accessor: 'sentiment' },
    { label: 'Title', accessor: 'title' },
    { label: 'Review', accessor: (r) => r.text?.substring(0, 200) },
    { label: 'Verified', accessor: (r) => r.verified ? 'Yes' : 'No' },
    { label: 'Date', accessor: 'date' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>⭐ Review Analyzer</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Analyze Amazon reviews — sentiment, themes, strengths & weaknesses</p>
        </div>
        {result && result.reviews && (
          <ExportButton
            onCSV={() => exportToCSV(result.reviews, exportColumns, `reviews-${result.asin}`)}
            onPDF={() => exportToPDF(result.reviews, exportColumns, `reviews-${result.asin}`, `Review Analysis — ${result.asin} | Avg: ${result.avgRating}���`)}
          />
        )}
      </div>

      {/* Search Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAnalyze}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Marketplace</label>
              <select className="form-control" value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}>
                {countries.map(c => <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">ASIN</label>
              <input className="form-control" value={asin} onChange={(e) => setAsin(e.target.value)}
                placeholder="e.g. B0BSHF7WHW" required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loader" /> : '⭐ Analyze Reviews'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <span className="loader" style={{ marginBottom: 16 }} />
          <p style={{ color: '#6b7280' }}>Scraping & analyzing reviews... This may take 15-30 seconds.</p>
        </div>
      )}

      {result && result.totalReviews === 0 && (
        <div className="alert alert-info">No reviews found for {result.asin}. Try a different ASIN or marketplace.</div>
      )}

      {result && result.totalReviews > 0 && (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Reviews Analyzed', value: result.totalReviews, icon: '📝', color: '#3b82f6' },
              { label: 'Avg Rating', value: `${result.avgRating}⭐`, icon: '⭐', color: '#f59e0b' },
              { label: 'Positive', value: `${result.sentiment.positivePercent}%`, icon: '😊', color: '#22c55e' },
              { label: 'Negative', value: `${result.sentiment.negativePercent}%`, icon: '😞', color: '#ef4444' },
              { label: 'Neutral', value: `${result.sentiment.neutralPercent}%`, icon: '😐', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 16, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Product Title */}
          {result.productTitle && (
            <div className="card" style={{ marginBottom: 20, padding: '12px 18px' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>📦 {result.productTitle}</span>
              <span style={{ float: 'right', fontFamily: 'monospace', color: '#FF9900', fontWeight: 700 }}>{result.asin}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Rating Distribution */}
            <div className="card">
              <h3 className="card-title">📊 Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[5,4,3,2,1].map(r => ({ rating: `${r}⭐`, count: result.ratingDistribution[r] || 0, fill: RATING_COLORS[r] }))}>
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[5,4,3,2,1].map((r, i) => <Cell key={i} fill={RATING_COLORS[r]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Pie */}
            <div className="card">
              <h3 className="card-title">🎭 Sentiment Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Positive', value: result.sentiment.positive },
                    { name: 'Negative', value: result.sentiment.negative },
                    { name: 'Neutral', value: result.sentiment.neutral },
                  ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {['positive', 'negative', 'neutral'].map((s, i) => <Cell key={i} fill={SENTIMENT_COLORS[s]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Strengths */}
            <div className="card">
              <h3 className="card-title">💪 Strengths</h3>
              {result.strengths.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.strengths.map((s, i) => (
                    <span key={i} className="badge badge-green" style={{ fontSize: 13, padding: '4px 12px' }}>✅ {s}</span>
                  ))}
                </div>
              ) : <p style={{ color: '#6b7280', fontSize: 13 }}>Not enough positive reviews to determine.</p>}
            </div>

            {/* Weaknesses */}
            <div className="card">
              <h3 className="card-title">⚠️ Weaknesses</h3>
              {result.weaknesses.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.weaknesses.map((w, i) => (
                    <span key={i} className="badge badge-red" style={{ fontSize: 13, padding: '4px 12px' }}>❌ {w}</span>
                  ))}
                </div>
              ) : <p style={{ color: '#6b7280', fontSize: 13 }}>Not enough negative reviews to determine.</p>}
            </div>
          </div>

          {/* Themes */}
          {result.themes.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">🏷️ Common Themes</h3>
              {result.themes.map((t, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{t.theme}</span>
                    <span style={{ color: '#6b7280' }}>{t.mentions} mentions ({t.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                    <div style={{ width: `${t.percentage}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #FF9900, #f59e0b)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Keywords */}
          {result.topKeywords.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">🔤 Top Keywords</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.topKeywords.map((k, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    background: i < 5 ? 'rgba(255,153,0,0.15)' : 'var(--bg-secondary)',
                    color: i < 5 ? '#FF9900' : 'var(--text-secondary)',
                    border: `1px solid ${i < 5 ? 'rgba(255,153,0,0.3)' : 'var(--border-color)'}`,
                  }}>
                    {k.word} <strong>({k.count})</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Individual Reviews */}
          <div className="card">
            <h3 className="card-title">📝 Reviews ({result.reviews.length})</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rating</th>
                    <th>Sentiment</th>
                    <th>Title</th>
                    <th>Review</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {result.reviews.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ color: RATING_COLORS[r.rating] || '#6b7280', fontWeight: 700 }}>
                          {'⭐'.repeat(r.rating)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.sentiment === 'positive' ? 'badge-green' : r.sentiment === 'negative' ? 'badge-red' : 'badge-yellow'}`}>
                          {r.sentiment === 'positive' ? '😊' : r.sentiment === 'negative' ? '😞' : '😐'} {r.sentiment}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title || '—'}
                      </td>
                      <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.text?.substring(0, 150) || '—'}
                      </td>
                      <td>{r.verified ? <span className="badge badge-green">✅</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
