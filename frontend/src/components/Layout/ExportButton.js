/**
 * =============================================
 * EXPORT BUTTON COMPONENT
 * =============================================
 * Reusable export dropdown — CSV & PDF
 * Usage: <ExportButton onCSV={handleCSV} onPDF={handlePDF} />
 * =============================================
 */

import React, { useState, useRef, useEffect } from 'react';

export default function ExportButton({ onCSV, onPDF, disabled = false, label = 'Export' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', fontSize: 13, fontWeight: 600,
        }}
      >
        📤 {label} ▾
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 100,
          minWidth: 160, overflow: 'hidden',
        }}>
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 16px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            📊 Export as CSV
          </button>
          <button
            onClick={() => { onPDF(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 16px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            📄 Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
