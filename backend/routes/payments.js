/**
 * PAYMENT ROUTES (auth required)
 * POST /api/payments/razorpay/create-order
 * POST /api/payments/razorpay/verify
 * POST /api/payments/paypal/create-order
 * POST /api/payments/paypal/capture
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Payment = require('../models/Payment');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

router.use(authMiddleware);

async function activateSubscription(userId, planName, duration, paymentId, licenseKeyId = null) {
  const now = new Date();
  const expires = new Date(now);
  if (duration === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }

  await UserSubscription.create({
    user_id: userId,
    plan_name: planName,
    duration,
    status: 'active',
    starts_at: now,
    expires_at: expires,
    payment_id: paymentId,
    license_key_id: licenseKeyId,
  });

  const validPlans = ['free', 'basic', 'pro', 'enterprise'];
  const plan = validPlans.includes(planName) ? planName : 'basic';
  await User.update({ subscription_plan: plan }, { where: { id: userId } });

  return expires;
}

// ---- Razorpay ----

router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { plan_name, duration } = req.body;
    if (!plan_name || !duration) {
      return res.status(400).json({ success: false, message: 'plan_name and duration are required.' });
    }

    const plan = await SubscriptionPlan.findOne({ where: { name: plan_name, is_active: true } });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    const amount = duration === 'yearly' ? parseFloat(plan.price_yearly) : parseFloat(plan.price_monthly);
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Cannot create order for free plan.' });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured.' });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: plan.currency || 'INR',
      receipt: `order_${req.user.id}_${Date.now()}`,
    });

    // Create pending payment record
    const payment = await Payment.create({
      user_id: req.user.id,
      plan_name,
      duration,
      amount,
      currency: plan.currency || 'INR',
      payment_gateway: 'razorpay',
      gateway_order_id: order.id,
      status: 'pending',
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      payment_id: payment.id,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

router.post('/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    const payment = await Payment.findOne({ where: { id: payment_id, user_id: req.user.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    await payment.update({
      gateway_payment_id: razorpay_payment_id,
      gateway_signature: razorpay_signature,
      status: 'completed',
    });

    const expires = await activateSubscription(req.user.id, payment.plan_name, payment.duration, payment.id);
    res.json({ success: true, message: 'Payment verified and subscription activated!', expires_at: expires });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// ---- PayPal ----

router.post('/paypal/create-order', async (req, res) => {
  try {
    const { plan_name, duration } = req.body;
    if (!plan_name || !duration) {
      return res.status(400).json({ success: false, message: 'plan_name and duration are required.' });
    }

    const plan = await SubscriptionPlan.findOne({ where: { name: plan_name, is_active: true } });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    const amount = duration === 'yearly' ? parseFloat(plan.price_yearly) : parseFloat(plan.price_monthly);
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Cannot create order for free plan.' });

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ success: false, message: 'PayPal not configured.' });
    }

    // Get PayPal access token
    const authString = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const baseUrl = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const tokenRes = await axios.post(`${baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: { Authorization: `Basic ${authString}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const accessToken = tokenRes.data.access_token;

    // Create PayPal order (INR -> USD approximate, or use USD as currency)
    const orderRes = await axios.post(`${baseUrl}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: (amount / 83).toFixed(2) }, // rough INR to USD
        description: `${plan.display_name} - ${duration} subscription`,
      }],
    }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });

    const ppOrder = orderRes.data;

    const payment = await Payment.create({
      user_id: req.user.id,
      plan_name,
      duration,
      amount,
      currency: plan.currency || 'INR',
      payment_gateway: 'paypal',
      gateway_order_id: ppOrder.id,
      status: 'pending',
    });

    res.json({ success: true, order_id: ppOrder.id, payment_id: payment.id });
  } catch (err) {
    console.error('PayPal create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create PayPal order.' });
  }
});

router.post('/paypal/capture', async (req, res) => {
  try {
    const { paypal_order_id, payment_id } = req.body;
    if (!paypal_order_id || !payment_id) {
      return res.status(400).json({ success: false, message: 'Missing capture data.' });
    }

    const authString = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const baseUrl = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const tokenRes = await axios.post(`${baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: { Authorization: `Basic ${authString}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const accessToken = tokenRes.data.access_token;

    const captureRes = await axios.post(`${baseUrl}/v2/checkout/orders/${paypal_order_id}/capture`, {}, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    const capture = captureRes.data;
    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'PayPal payment not completed.' });
    }

    const payment = await Payment.findOne({ where: { id: payment_id, user_id: req.user.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    await payment.update({ gateway_payment_id: paypal_order_id, status: 'completed' });

    const expires = await activateSubscription(req.user.id, payment.plan_name, payment.duration, payment.id);
    res.json({ success: true, message: 'PayPal payment completed and subscription activated!', expires_at: expires });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ success: false, message: 'Failed to capture PayPal payment.' });
  }
});

module.exports = router;
