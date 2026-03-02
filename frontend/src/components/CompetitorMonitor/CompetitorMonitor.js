import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

export default function CompetitorMonitor() {
  const { countryCode, currentCountry, countries, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [asin, setAsin] = useState('');
  const [trackedItems, setTrackedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTrackedItems();
  }, []);

  const loadTrackedItems = async () => {
    try {
      const res = await api.get('/competitor/list');
      setTrackedItems(res.data.items || []);
    } catch {
      // Silently fail
    }
  };

  const handleAddTracking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!asin.trim()) return;
    setLoading(true);
    try {
      await api.post('/competitor/track', {
        asin: asin.trim().toUpperCase(),
        countryCode: selectedCountry,
      });
      setSuccess(`ASIN ${asin.trim().toUpperCase()} added to tracking!`);
      setAsin('');
      await loadTrackedItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tracking.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (id) => {
    setCheckingId(id);
    setError('');
    try {
      const res = await api.post(`/competitor/${id}/check`);
      setSuccess(`Price check done: ${res.data.data?.price} ${res.data.data?.currency}`);
      await loadTrackedItems();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Price check failed.');
    } finally {
      setCheckingId(null);
    }
  };

  const handleViewHistory = async (item) => {
    setSelectedItem(item);
    try {
      const res = await api.get(`/competitor/${item.id}/history`);
      setPriceHistory(res.data.history || []);
    } catch {
      setPriceHistory([]);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this ASIN from tracking?')) return;
    try {
      await api.delete(`/competitor/${id}`);
      setTrackedItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch {
      setError('Failed to remove.');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>👁️ Competitor Price Monitor</h2>

      {/* Add Tracking Form */}
      <div className="card">
        <h3 className="card-title">Track New ASIN</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleAddTracking}>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flexGrow: 2 }}>
              <label className="form-label">ASIN</label>
              <input
                className="form-control"
                type="text"
                value={asin}
                onChange={(e) => setAsin(e.target.value)}
                placeholder="B08N5WRWNW"
                maxLength={10}
                pattern="[A-Za-z0-9]{10}"
                title="10-character Amazon ASIN"
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
                  <option key={c.code} value={c.code}>{c.flag || ''} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loader" /> : '+ Track ASIN'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tracked Items */}
      {trackedItems.length > 0 && (
        <div className="card">
          <h3 className="card-title">Tracked ASINs ({trackedItems.length})</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ASIN</th>
                  <th>Title</th>
                  <th>Country</th>
                  <th>Marketplace</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackedItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.asin}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_title || '(not fetched yet)'}
                    </td>
                    <td><span className="badge badge-blue">{item.country_code}</span></td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>{item.marketplace}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleCheck(item.id)}
                          disabled={checkingId === item.id}
                        >
                          {checkingId === item.id ? <span className="loader" style={{ width: 12, height: 12 }} /> : '🔄 Check'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleViewHistory(item)}
                        >
                          📈 History
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleRemove(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trackedItems.length === 0 && (
        <div className="alert alert-info">No ASINs tracked yet. Add one above to start monitoring prices.</div>
      )}

      {/* Price History */}
      {selectedItem && (
        <div className="card">
          <h3 className="card-title">
            Price History — {selectedItem.asin}
            {selectedItem.product_title && <span style={{ fontWeight: 400, fontSize: 14, color: '#6b7280' }}> — {selectedItem.product_title}</span>}
          </h3>
          {priceHistory.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>No price history yet. Click "Check" to fetch the current price.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Price</th>
                    <th>Currency</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontSize: 13 }}>{new Date(h.recorded_at).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{h.price}</td>
                      <td>{h.currency}</td>
                      <td>
                        <span className={`badge ${(() => { const s = (h.stock_status || '').toLowerCase(); return s.includes('stock') && !s.includes('out') ? 'badge-green' : 'badge-red'; })()}`}>
                          {h.stock_status || 'Unknown'}
                        </span>
                      </td>
                      <td>{h.rating || '—'}</td>
                      <td>{h.review_count?.toLocaleString() || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
