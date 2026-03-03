/**
 * ACTIVATION KEY ROUTES
 * POST /api/activate  — activate an Amazon key card (auth required)
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ActivationKey = require('../models/ActivationKey');
const User = require('../models/User');
const UserSubscription = require('../models/UserSubscription');
const Payment = require('../models/Payment');

// Map activation key plan types to subscription_plan enum values
const PLAN_MAP = {
  starter: 'basic',
  professional: 'pro',
  enterprise: 'enterprise',
};

router.use(authMiddleware);

// POST /api/activate
router.post('/', async (req, res) => {
  try {
    const rawCode = req.body.keyCode;
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Activation key is required.' });
    }

    const keyCode = rawCode.trim().toUpperCase();

    const key = await ActivationKey.findOne({ where: { key_code: keyCode } });
    if (!key) {
      return res.status(400).json({ success: false, message: 'Invalid activation key.' });
    }
    if (key.is_used) {
      return res.status(400).json({ success: false, message: 'This activation key has already been used.' });
    }

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + key.duration_months);

    // Mark key as used
    await key.update({
      is_used: 1,
      used_by: req.user.id,
      used_at: now,
    });

    const duration = key.duration_months >= 12 ? 'yearly' : 'monthly';

    // Create payment record
    const payment = await Payment.create({
      user_id: req.user.id,
      plan_name: PLAN_MAP[key.plan_type] || 'basic',
      duration,
      amount: 0,
      payment_gateway: 'license_key',
      status: 'completed',
    });

    // Create subscription record
    await UserSubscription.create({
      user_id: req.user.id,
      plan_name: PLAN_MAP[key.plan_type] || 'basic',
      duration,
      status: 'active',
      starts_at: now,
      expires_at: expiryDate,
      payment_id: payment.id,
    });

    // Update user subscription plan
    const planName = PLAN_MAP[key.plan_type] || 'basic';
    await User.update(
      {
        subscription_plan: planName,
        plan_expiry: expiryDate,
        subscription_source: 'amazon_key_card',
      },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Activation key applied successfully!',
      plan: key.plan_type,
      plan_name: planName,
      expires_at: expiryDate,
    });
  } catch (err) {
    console.error('Activation key error:', err);
    res.status(500).json({ success: false, message: 'Failed to activate key.' });
  }
});

module.exports = router;
