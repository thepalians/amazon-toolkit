import React, { useState } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

export default function KeywordResearch() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [keyword, setKeyword] = useState('');
  const [includeAlphabet, setIncludeAlphabet] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const res = await api.post('/keywords/research', {
        keyword: keyword.trim(),
        countryCode: selectedCountry,
        includeAlphabet,
        maxResults: 50,
      });
      setResults(res.data.suggestions || []);
      setSearched(keyword.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Keyword research failed.');
    } finally {
      setLoading(false);
    }
  };

  const competitionBadge = (level) => {
    const map = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red' };
    return map[level] || 'badge-gray';
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>🔍 Keyword Research</h2>

      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flexGrow: 2 }}>
              <label className="form-label">Seed Keyword</label>
              <input
                className="form-control"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. wireless earbuds, yoga mat..."
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marketplace</label>
              <select
                className="form-control"
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); changeCountry(e.target.value); }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag || ''} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="alpha" checked={includeAlphabet} onChange={(e) => setIncludeAlphabet(e.target.checked)} />
              <label htmlFor="alpha" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Alphabet permutations</label>
            </div>
            <div className="form-group">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loader" /> : '🔍 Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {results.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>
              Results for "{searched}" — {results.length} suggestions
            </h3>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Marketplace: {currentCountry?.name}
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Keyword</th>
                  <th>Est. Volume</th>
                  <th>Competition</th>
                  <th>Trend Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#6b7280' }}>{r.position || i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r.keyword}</td>
                    <td>{r.searchVolumeEstimate}</td>
                    <td>
                      <span className={`badge ${competitionBadge(r.competitionLevel)}`}>
                        {r.competitionLevel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                          <div style={{ width: `${r.trendingScore}%`, height: '100%', background: '#FF9900', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{r.trendingScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="alert alert-info">
          No suggestions found. Try a different keyword or marketplace.
        </div>
      )}
    </div>
  );
}
