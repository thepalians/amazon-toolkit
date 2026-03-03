import React, { useState } from 'react';
import { FiKey, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import api from '../../services/api';

function formatKeyInput(value) {
  // Strip non-hex and non-dash, uppercase
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Build AST-XXXX-XXXX-XXXX
  const prefix = 'AST';
  const body = raw.startsWith('AST') ? raw.slice(3) : raw;
  const hex = body.replace(/[^0-9A-F]/g, '').slice(0, 12);
  const parts = [prefix];
  for (let i = 0; i < hex.length; i += 4) {
    parts.push(hex.slice(i, i + 4));
  }
  return parts.join('-');
}

export default function ActivatePage() {
  const [keyCode, setKeyCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setKeyCode(formatKeyInput(e.target.value));
    if (status !== 'idle') setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyCode || keyCode.length < 16) return;
    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const res = await api.post('/activate', { keyCode });
      setResult(res.data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to activate key. Please try again.');
      setStatus('error');
    }
  };

  const planLabel = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <FiKey size={28} color="#FF9900" />
          </div>
          <h1 style={styles.title}>Activate Key Card</h1>
          <p style={styles.subtitle}>Enter the activation code from your Amazon Seller Toolkit key card</p>
        </div>

        {/* Activation Form */}
        {status !== 'success' && (
          <div className="card" style={styles.card}>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Activation Code</label>
              <input
                type="text"
                value={keyCode}
                onChange={handleChange}
                placeholder="AST-XXXX-XXXX-XXXX"
                maxLength={19}
                style={{
                  ...styles.input,
                  borderColor: status === 'error' ? '#ef4444' : 'var(--border-color)',
                }}
                disabled={status === 'loading'}
                autoFocus
                spellCheck={false}
              />
              {status === 'error' && (
                <div style={styles.errorBox}>
                  <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={status === 'loading' || keyCode.length < 16}
                style={{
                  ...styles.button,
                  opacity: (status === 'loading' || keyCode.length < 16) ? 0.6 : 1,
                  cursor: (status === 'loading' || keyCode.length < 16) ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <FiLoader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Activating...
                  </>
                ) : (
                  <>
                    <FiKey size={16} />
                    Activate
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && result && (
          <div className="card" style={styles.successCard}>
            <div style={styles.successIcon}>
              <FiCheckCircle size={48} color="#22c55e" />
            </div>
            <h2 style={styles.successTitle}>Activation Successful!</h2>
            <p style={styles.successSubtitle}>Your subscription has been activated.</p>
            <div style={styles.planBadge}>
              {planLabel[result.plan] || result.plan_name} Plan
            </div>
            <div style={styles.expiryInfo}>
              <span style={styles.expiryLabel}>Expires on</span>
              <span style={styles.expiryDate}>
                {result.expires_at ? new Date(result.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </span>
            </div>
            <button
              onClick={() => { setStatus('idle'); setKeyCode(''); }}
              style={styles.resetButton}
            >
              Activate Another Key
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="card" style={styles.instructionsCard}>
          <div style={styles.instructionsTitle}>
            <FiKey size={16} color="#FF9900" />
            How to Activate
          </div>
          <ol style={styles.instructionsList}>
            <li style={styles.instructionItem}>Purchase an Amazon Seller Toolkit key card from Amazon.in or Amazon.com.</li>
            <li style={styles.instructionItem}>Scratch the silver area on the back of your card to reveal the code.</li>
            <li style={styles.instructionItem}>Enter your code above in the format <code style={styles.code}>AST-XXXX-XXXX-XXXX</code>.</li>
            <li style={styles.instructionItem}>Click <strong>Activate</strong> to unlock your subscription plan.</li>
          </ol>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '32px 16px',
    background: 'var(--bg-primary)',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    textAlign: 'center',
    paddingBottom: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: 'rgba(255,153,0,0.12)',
    border: '1px solid rgba(255,153,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  card: {
    padding: 28,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    fontSize: 20,
    fontFamily: 'monospace',
    letterSpacing: 2,
    border: '2px solid var(--border-color)',
    borderRadius: 10,
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    textAlign: 'center',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: '10px 14px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 8,
    color: '#ef4444',
    fontSize: 13,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    width: '100%',
    padding: '14px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'var(--gradient-primary)',
    border: 'none',
    borderRadius: 10,
    transition: 'opacity 0.2s',
  },
  successCard: {
    padding: 36,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  successSubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  planBadge: {
    marginTop: 8,
    padding: '8px 24px',
    background: 'rgba(255,153,0,0.12)',
    color: '#FF9900',
    borderRadius: 99,
    fontSize: 16,
    fontWeight: 700,
    border: '1px solid rgba(255,153,0,0.25)',
  },
  expiryInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  expiryLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  expiryDate: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  resetButton: {
    marginTop: 8,
    padding: '10px 24px',
    background: 'var(--bg-surface-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  instructionsCard: {
    padding: 24,
  },
  instructionsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 14,
  },
  instructionsList: {
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  code: {
    fontFamily: 'monospace',
    background: 'var(--bg-surface-hover)',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 12,
    color: '#FF9900',
  },
};
