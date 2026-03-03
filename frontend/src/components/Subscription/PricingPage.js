import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiX, FiKey } from 'react-icons/fi';
import api from '../../services/api';
import { useCountry } from '../../context/CountryContext';

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

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', CAD: 'C$',
  AUD: 'A$', JPY: '¥', SGD: 'S$', SAR: 'ر.س', INR: '₹',
};

export default function PricingPage() {
  const { currentCountry } = useCountry();
  const userCurrency = currentCountry?.currency || 'USD';
  const isINR = userCurrency === 'INR';

  const [yearly, setYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [subscription, setSubscription] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [keyMsg, setKeyMsg] = useState('');
  const [keyError, setKeyError] = useState('');
  const [activating, setActivating] = useState(false);
  const [payingPlan, setPayingPlan] = useState(null);
  const [rates, setRates] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const paypalContainerRefs = useRef({});
  const paypalPaymentIds = useRef({});
  const paypalButtonInstances = useRef({});

  useEffect(() => {
    api.get('/subscription/current')
      .then((res) => {
        setCurrentPlan(res.data.plan || 'free');
        setSubscription(res.data.subscription);
      })
      .catch(() => {});
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    api.get('/currency/rates')
      .then((res) => {
        if (res.data?.rates) setRates(res.data.rates);
      })
      .catch(() => {});
  }, []);

  // Load Razorpay script (for INR users)
  useEffect(() => {
    if (!isINR) return;
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [isINR]);

  // Load PayPal SDK (for non-INR users)
  useEffect(() => {
    if (isINR) return;
    if (document.getElementById('paypal-sdk')) {
      if (window.paypal) setPaypalLoaded(true);
      return;
    }

    api.get('/payments/paypal/config')
      .then((res) => {
        const clientId = res.data?.client_id;
        if (!clientId) return;

        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => setPaypalLoaded(true);
        document.body.appendChild(script);
      })
      .catch(() => {});
  }, [isINR]);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (isINR || !paypalLoaded || !window.paypal) return;

    PLANS.forEach((plan) => {
      if (plan.name === 'free') return;
      const container = paypalContainerRefs.current[plan.name];
      if (!container) return;

      // Close/clean previous button instance
      if (paypalButtonInstances.current[plan.name]) {
        try { paypalButtonInstances.current[plan.name].close(); } catch (err) { /* ignore close errors */ }
      }
      container.innerHTML = '';

      const planRef = plan;
      const buttons = window.paypal.Buttons({
        style: { layout: 'horizontal', color: 'gold', shape: 'rect', label: 'buynow', height: 40, tagline: false },
        createOrder: async () => {
          setPayingPlan(planRef.name);
          try {
            const res = await api.post('/payments/paypal/create-order', {
              plan_name: planRef.name,
              duration: yearly ? 'yearly' : 'monthly',
            });
            paypalPaymentIds.current[planRef.name] = res.data.payment_id;
            return res.data.order_id;
          } catch (err) {
            setPayingPlan(null);
            alert(err.response?.data?.message || 'Failed to create PayPal order.');
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            const payment_id = paypalPaymentIds.current[planRef.name];
            await api.post('/payments/paypal/capture', {
              paypal_order_id: data.orderID,
              payment_id,
            });
            setCurrentPlan(planRef.name);
            alert('Payment successful! Your subscription is now active.');
          } catch {
            alert('Payment capture failed. Please contact support.');
          } finally {
            setPayingPlan(null);
          }
        },
        onCancel: () => { setPayingPlan(null); },
        onError: () => {
          setPayingPlan(null);
          alert('PayPal encountered an error. Please try again.');
        },
      });

      paypalButtonInstances.current[planRef.name] = buttons;
      buttons.render(container);
    });
  }, [isINR, paypalLoaded, yearly, currentPlan]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Convert INR price to user's currency
  const getConvertedPrice = (inrPrice) => {
    if (isINR || !rates || inrPrice === 0) return null;
    const rate = rates[userCurrency] || rates['USD'];
    if (!rate) return null;
    const converted = inrPrice * rate;
    return userCurrency === 'JPY' ? Math.round(converted) : parseFloat(converted.toFixed(2));
  };

  const currencySymbol = CURRENCY_SYMBOLS[userCurrency] || '$';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>Choose Your Plan</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 16 }}>
          Upgrade to unlock more features for your Amazon business
        </p>

        {/* Monthly / Yearly Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 20, background: 'var(--bg-surface-hover)', borderRadius: 99, padding: '5px' }}>
          <button
            onClick={() => setYearly(false)}
            style={{ padding: '7px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: !yearly ? 'var(--bg-surface)' : 'transparent',
              color: !yearly ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: !yearly ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)' }}
          >Monthly</button>
          <button
            onClick={() => setYearly(true)}
            style={{ padding: '7px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: yearly ? 'var(--bg-surface)' : 'transparent',
              color: yearly ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: yearly ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)' }}
          >Yearly <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>Save 17%</span></button>
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, marginBottom: 48 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          const inrPrice = yearly ? plan.yearly : plan.monthly;
          const convertedPrice = getConvertedPrice(inrPrice);
          const displayPrice = isINR ? inrPrice : convertedPrice;
          const defaultShadow = plan.popular ? `0 4px 24px ${plan.color}30` : 'var(--shadow-sm)';
          const handleEnter = (e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; };
          const handleLeave = (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = defaultShadow; };
          return (
            <div key={plan.name} style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              boxShadow: defaultShadow,
              border: `2px solid ${plan.popular ? plan.color : isCurrent ? plan.color : 'var(--border-color)'}`,
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                  ✦ MOST POPULAR
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: -14, right: 16,
                  background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>
                  CURRENT
                </div>
              )}

              <div style={{ fontSize: 17, fontWeight: 700, color: plan.color }}>{plan.display}</div>

              <div style={{ marginTop: 12 }}>
                {inrPrice === 0 ? (
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>Free</span>
                ) : isINR ? (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>₹{inrPrice.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>/{yearly ? 'yr' : 'mo'}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currencySymbol}{displayPrice != null ? (userCurrency === 'JPY' ? displayPrice.toLocaleString() : displayPrice.toFixed(2)) : '...'}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>/{yearly ? 'yr' : 'mo'}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      ≈ converted from ₹{inrPrice.toLocaleString('en-IN')}
                    </div>
                  </>
                )}
              </div>

              <hr style={{ margin: '16px 0', borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <FeatureRow check label={`Profit Calc: ${plan.limits.profit_calculator}`} />
                <FeatureRow check label={`Keywords: ${plan.limits.keyword_research}`} />
                <FeatureRow check label={`Listing: ${plan.limits.listing_optimizer}`} />
                <FeatureRow check label={`Competitor: ${plan.limits.competitor_monitor}`} />
                <FeatureRow check={plan.features.price_alerts} label="Price Alerts" />
                <FeatureRow check={plan.features.api_access} label="API Access" />
                <FeatureRow check={plan.features.priority_support} label="Priority Support" />
              </div>

              {/* Payment button area */}
              {!isINR && plan.name !== 'free' && !isCurrent ? (
                <div style={{ marginTop: 20 }}>
                  {paypalLoaded ? (
                    <div
                      ref={(el) => { paypalContainerRefs.current[plan.name] = el; }}
                      style={{ minHeight: 40 }}
                    />
                  ) : (
                    <button
                      disabled
                      style={{
                        width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
                        background: 'var(--bg-surface-hover)', color: 'var(--text-muted)',
                        fontWeight: 700, fontSize: 14, cursor: 'default',
                      }}
                    >
                      Loading PayPal...
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => isINR ? handleBuy(plan) : undefined}
                  disabled={isCurrent || plan.name === 'free' || payingPlan === plan.name}
                  style={{
                    marginTop: 20, width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
                    background: isCurrent ? 'var(--bg-surface-hover)' : plan.name === 'free' ? 'var(--bg-surface-hover)' : plan.color,
                    color: isCurrent || plan.name === 'free' ? 'var(--text-muted)' : '#fff',
                    fontWeight: 700, fontSize: 14, cursor: isCurrent || plan.name === 'free' ? 'default' : 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isCurrent ? 'Current Plan' : plan.name === 'free' ? 'Free' : payingPlan === plan.name ? 'Processing...' : 'Buy Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* License Key Activation */}
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
          <FiKey size={18} color="var(--accent)" /> Activate License Key
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Have a license key? Enter it below to activate your subscription.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            placeholder="AST-XXXXX-XXXXX-XXXXX-XXXXX"
            className="form-control"
            style={{ flex: 1, fontFamily: 'monospace' }}
          />
          <button
            onClick={handleActivateKey}
            disabled={activating || !licenseKey.trim()}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {activating ? '...' : 'Activate'}
          </button>
        </div>
        {keyMsg && <div style={{ marginTop: 10, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{keyMsg}</div>}
        {keyError && <div style={{ marginTop: 10, color: '#ef4444', fontSize: 13 }}>{keyError}</div>}
      </div>

      {/* Current subscription info */}
      {subscription && (
        <div className="card" style={{ maxWidth: 480, margin: '16px auto 0', padding: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Active Subscription:</strong> {subscription.plan_name} ({subscription.duration})
          <br />
          <strong style={{ color: 'var(--text-primary)' }}>Expires:</strong> {new Date(subscription.expires_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function FeatureRow({ check, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {check
        ? <FiCheck size={14} color="#22c55e" style={{ flexShrink: 0 }} />
        : <FiX size={14} color="#ef4444" style={{ flexShrink: 0 }} />}
      <span style={{ color: check ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
