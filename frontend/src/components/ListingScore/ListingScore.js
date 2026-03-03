import React, { useState } from 'react';
import api from '../../services/api';
import ExportButton from '../Layout/ExportButton';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function ListingScore() {
  const [form, setForm] = useState({
    title: '',
    bulletsText: '',
    description: '',
    keywordsText: '',
    imageCount: '0',
    price: '0',
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
      const bullets = form.bulletsText.split('\n').map(b => b.trim()).filter(Boolean);
      const keywords = form.keywordsText.split(',').map(k => k.trim()).filter(Boolean);

      const res = await api.post('/listing-score/analyze', {
        title: form.title,
        bullets,
        description: form.description,
        keywords,
        imageCount: parseInt(form.imageCount) || 0,
        price: parseFloat(form.price) || 0,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  // Export
  const handleExportCSV = () => {
    if (!result) return;
    const data = result.sections.flatMap(s =>
      s.checks.map(c => ({
        section: s.name,
        check: c.name,
        status: c.passed ? 'PASS' : 'FAIL',
        sectionScore: `${s.score}/${s.maxScore}`,
      }))
    );
    data.push({ section: 'TOTAL', check: 'Overall Score', status: result.grade.letter, sectionScore: `${result.totalScore}/100` });
    const columns = [
      { label: 'Section', accessor: 'section' },
      { label: 'Check', accessor: 'check' },
      { label: 'Status', accessor: 'status' },
      { label: 'Score', accessor: 'sectionScore' },
    ];
    exportToCSV(data, columns, 'listing-quality-score');
  };

  const handleExportPDF = () => {
    if (!result) return;
    const data = result.sections.flatMap(s =>
      s.checks.map(c => ({
        section: s.name,
        check: c.name,
        status: c.passed ? 'PASS' : 'FAIL',
        sectionScore: `${s.score}/${s.maxScore}`,
      }))
    );
    data.push({ section: 'TOTAL', check: 'Overall Score', status: result.grade.letter, sectionScore: `${result.totalScore}/100` });
    const columns = [
      { label: 'Section', accessor: 'section' },
      { label: 'Check', accessor: 'check' },
      { label: 'Status', accessor: 'status' },
      { label: 'Score', accessor: 'sectionScore' },
    ];
    exportToPDF(data, columns, 'listing-quality-score', `Listing Quality Score: ${result.totalScore}/100 (${result.grade.letter})`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📋 Listing Quality Score</h2>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Analyze your Amazon listing against best practices & A10 algorithm standards
          </p>
        </div>
        {result && <ExportButton onCSV={handleExportCSV} onPDF={handleExportPDF} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Input Form */}
        <div className="card">
          <h3 className="card-title">Enter Listing Details</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Product Title</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange}
                placeholder="Your Amazon product title..." required />
              <small style={{ color: '#9ca3af', fontSize: 11 }}>{form.title.length} characters (ideal: 80-200)</small>
            </div>

            <div className="form-group">
              <label className="form-label">Bullet Points (one per line)</label>
              <textarea className="form-control" name="bulletsText" value={form.bulletsText} onChange={handleChange}
                rows={6} placeholder={"Bullet point 1\nBullet point 2\nBullet point 3\nBullet point 4\nBullet point 5"} style={{ resize: 'vertical' }} />
              <small style={{ color: '#9ca3af', fontSize: 11 }}>
                {form.bulletsText.split('\n').filter(b => b.trim()).length} bullets (ideal: 5+)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Product Description</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange}
                rows={4} placeholder="Detailed product description..." style={{ resize: 'vertical' }} />
              <small style={{ color: '#9ca3af', fontSize: 11 }}>{form.description.length} characters (ideal: 200-2000)</small>
            </div>

            <div className="form-group">
              <label className="form-label">Backend Keywords (comma-separated)</label>
              <input className="form-control" name="keywordsText" value={form.keywordsText} onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3..." />
              <small style={{ color: '#9ca3af', fontSize: 11 }}>
                {form.keywordsText.split(',').filter(k => k.trim()).length} keywords
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Number of Images</label>
                <input className="form-control" type="number" name="imageCount" value={form.imageCount}
                  onChange={handleChange} min="0" max="9" />
              </div>
              <div className="form-group">
                <label className="form-label">Product Price</label>
                <input className="form-control" type="number" name="price" value={form.price}
                  onChange={handleChange} step="0.01" min="0" />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="loader" /> : '📊 Analyze Listing'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div>
            {/* Overall Score */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                border: `6px solid ${result.grade.color}`,
                background: `${result.grade.color}10`,
              }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: result.grade.color }}>{result.totalScore}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>/100</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: result.grade.color }}>{result.grade.letter}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>{result.grade.label}</div>
            </div>

            {/* Section Scores */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">Score Breakdown</h3>
              {result.sections.map((section, si) => (
                <div key={si} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: si < result.sections.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{section.icon} {section.name}</span>
                    <span style={{
                      fontWeight: 700, fontSize: 14, padding: '2px 10px', borderRadius: 99,
                      background: section.score >= section.maxScore * 0.8 ? '#dcfce7' : section.score >= section.maxScore * 0.5 ? '#fef9c3' : '#fee2e2',
                      color: section.score >= section.maxScore * 0.8 ? '#166534' : section.score >= section.maxScore * 0.5 ? '#854d0e' : '#dc2626',
                    }}>
                      {section.score}/{section.maxScore}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, marginBottom: 10 }}>
                    <div style={{
                      width: `${(section.score / section.maxScore) * 100}%`, height: '100%', borderRadius: 4,
                      background: section.score >= section.maxScore * 0.8 ? '#22c55e' : section.score >= section.maxScore * 0.5 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>

                  {/* Checks */}
                  <div style={{ fontSize: 13 }}>
                    {section.checks.map((check, ci) => (
                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                        <span style={{ fontSize: 14 }}>{check.passed ? '✅' : '❌'}</span>
                        <span style={{ color: check.passed ? 'var(--text-primary)' : '#ef4444' }}>{check.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="card">
                <h3 className="card-title">💡 Recommendations</h3>
                <div style={{ fontSize: 14, lineHeight: 2 }}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>{rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
