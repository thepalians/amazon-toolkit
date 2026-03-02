import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PLANS = [
  {
    name: 'free',
    display: 'Free',
    monthly: 0,
    yearly: 0,
    color: '#6b7280',
    limits: { profit_calculator: '5/day', keyword_research: '3/day', listing_optimizer: '1/day', competitor_monitor: '1 ASIN' },
    features: { price_alerts: false, api_access: false, priority_support: false },
  },
  {
    name: 'basic',
    display: 'Basic',
    monthly: 499,
    yearly: 4999,
    color: '#3b82f6',
    limits: { profit_calculator: 'Unlimited', keyword_research: '20/day', listing_optimizer: '5/day', competitor_monitor: '5 ASINs' },
    features: { price_alerts: false, api_access: false, priority_support: false },
    popular: false,
  },
  {
    name: 'premium',
    display: 'Premium',
    monthly: 999,
    yearly: 9999,
    color: '#8b5cf6',
    limits: { profit_calculator: 'Unlimited', keyword_research: 'Unlimited', listing_optimizer: '20/day', competitor_monitor: '20 ASINs' },
    features: { price_alerts: true, api_access: false, priority_support: true },
    popular: true,
  },
  {
    name: 'pro',
    display: 'Pro',
    monthly: 1999,
    yearly: 19999,
    color: '#FF9900',
    limits: { profit_calculator: 'Unlimited', keyword_research: 'Unlimited', listing_optimizer: 'Unlimited', competitor_monitor: 'Unlimited' },
    features: { price_alerts: true, api_access: true, priority_support: true },
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [subscription, setSubscription] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [keyMsg, setKeyMsg] = useState('');
  const [keyError, setKeyError] = useState('');
  const [activating, setActivating] = useState(false);
  const [payingPlan, setPayingPlan] = useState(null);

  useEffect(() => {
    api.get('/subscription/current')
      .then((res) => {
        setCurrentPlan(res.data.plan || 'free');
        setSubscription(res.data.subscription);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleActivateKey = async () => {
    if (!licenseKey.trim()) return;
    setActivating(true);
    setKeyMsg('');
    setKeyError('');
    try {
      const res = await api.post('/subscription/activate-key', { licenseKey: licenseKey.trim() });
      setKeyMsg(res.data.message || 'Key activated!');
      setCurrentPlan(res.data.plan);
      setLicenseKey('');
    } catch (err) {
      setKeyError(err.response?.data?.message || 'Failed to activate key.');
    } finally {
      setActivating(false);
    }
  };

  const handleBuy = async (plan) => {
    if (plan.name === 'free') return;
    setPayingPlan(plan.name);
    try {
      const res = await api.post('/payments/razorpay/create-order', {
        plan_name: plan.name,
        duration: yearly ? 'yearly' : 'monthly',
      });
      const { order_id, amount, currency, key_id, payment_id } = res.data;

      const options = {
        key: key_id,
        amount,
        currency,
        name: 'Amazon Seller Toolkit',
        description: `${plan.display} Plan - ${yearly ? 'Yearly' : 'Monthly'}`,
        order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id,
            });
            setCurrentPlan(plan.name);
            alert('Payment successful! Your subscription is now active.');
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#FF9900' },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert('Razorpay not loaded. Please refresh and try again.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      {/* Razorpay script loaded via useEffect */}

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827' }}>Choose Your Plan</h1>
        <p style={{ color: '#6b7280', marginTop: 8, fontSize: 16 }}>
          Upgrade to unlock more features for your Amazon business
        </p>

        {/* Monthly / Yearly Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20, background: '#f3f4f6', borderRadius: 99, padding: '6px 16px' }}>
          <button
            onClick={() => setYearly(false)}
            style={{ padding: '6px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: !yearly ? '#fff' : 'transparent', color: !yearly ? '#111827' : '#6b7280',
              boxShadow: !yearly ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
          >Monthly</button>
          <button
            onClick={() => setYearly(true)}
            style={{ padding: '6px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: yearly ? '#fff' : 'transparent', color: yearly ? '#111827' : '#6b7280',
              boxShadow: yearly ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
          >Yearly <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>Save 17%</span></button>
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, marginBottom: 48 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <div key={plan.name} style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 24px',
              boxShadow: plan.popular ? '0 4px 24px rgba(139,92,246,0.18)' : '0 1px 6px rgba(0,0,0,0.08)',
              border: `2px solid ${plan.popular ? plan.color : isCurrent ? plan.color : '#e5e7eb'}`,
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>
                  MOST POPULAR
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: -14, right: 16,
                  background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>
                  CURRENT PLAN
                </div>
              )}

              <div style={{ fontSize: 18, fontWeight: 700, color: plan.color }}>{plan.display}</div>

              <div style={{ marginTop: 12 }}>
                {price === 0 ? (
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>₹{price.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>/{yearly ? 'yr' : 'mo'}</span>
                  </>
                )}
              </div>

              <hr style={{ margin: '16px 0', borderColor: '#f3f4f6' }} />

              <div style={{ fontSize: 13, color: '#374151', lineHeight: 2 }}>
                <div>💰 Profit Calc: <strong>{plan.limits.profit_calculator}</strong></div>
                <div>🔍 Keywords: <strong>{plan.limits.keyword_research}</strong></div>
                <div>🤖 Listing: <strong>{plan.limits.listing_optimizer}</strong></div>
                <div>👁️ Competitor: <strong>{plan.limits.competitor_monitor}</strong></div>
                <div>{plan.features.price_alerts ? '✅' : '❌'} Price Alerts</div>
                <div>{plan.features.api_access ? '✅' : '❌'} API Access</div>
                <div>{plan.features.priority_support ? '✅' : '❌'} Priority Support</div>
              </div>

              <button
                onClick={() => handleBuy(plan)}
                disabled={isCurrent || plan.name === 'free' || payingPlan === plan.name}
                style={{
                  marginTop: 20, width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                  background: isCurrent ? '#e5e7eb' : plan.color, color: isCurrent ? '#6b7280' : '#fff',
                  fontWeight: 700, fontSize: 14, cursor: isCurrent || plan.name === 'free' ? 'default' : 'pointer',
                }}
              >
                {isCurrent ? 'Current Plan' : plan.name === 'free' ? 'Free' : payingPlan === plan.name ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* License Key Activation */}
      <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🔑 Activate License Key</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Have a license key? Enter it below to activate your subscription.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            placeholder="AST-XXXXX-XXXXX-XXXXX-XXXXX"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}
          />
          <button
            onClick={handleActivateKey}
            disabled={activating || !licenseKey.trim()}
            style={{ padding: '10px 20px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            {activating ? '...' : 'Activate'}
          </button>
        </div>
        {keyMsg && <div style={{ marginTop: 10, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{keyMsg}</div>}
        {keyError && <div style={{ marginTop: 10, color: '#ef4444', fontSize: 13 }}>{keyError}</div>}
      </div>

      {/* Current subscription info */}
      {subscription && (
        <div style={{ maxWidth: 480, margin: '24px auto 0', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', fontSize: 13, color: '#374151' }}>
          <strong>Active Subscription:</strong> {subscription.plan_name} ({subscription.duration})
          <br />
          <strong>Expires:</strong> {new Date(subscription.expires_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
