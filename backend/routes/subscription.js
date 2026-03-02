/**
 * SUBSCRIPTION ROUTES (auth required)
 * GET  /api/subscription/current      - current subscription
 * POST /api/subscription/activate-key - activate a license key
 * GET  /api/subscription/history      - subscription history
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const LicenseKey = require('../models/LicenseKey');
const Payment = require('../models/Payment');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');
const { getActivePlan, PLAN_LIMITS } = require('../middleware/planLimits');

router.use(authMiddleware);

// GET /api/subscription/current
router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    const sub = await UserSubscription.findOne({
      where: { user_id: req.user.id, status: 'active', expires_at: { [Op.gt]: now } },
      order: [['expires_at', 'DESC']],
    });
    const plan = await getActivePlan(req.user);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    res.json({ success: true, subscription: sub, plan, limits });
  } catch (err) {
    console.error('Subscription current error:', err);
    res.status(500).json({ success: false, message: 'Failed to load subscription.' });
  }
});

// POST /api/subscription/activate-key  { licenseKey }
router.post('/activate-key', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ success: false, message: 'License key is required.' });

    const key = await LicenseKey.findOne({ where: { license_key: licenseKey.trim().toUpperCase() } });
    if (!key) return res.status(404).json({ success: false, message: 'Invalid license key.' });
    if (key.status !== 'unused') {
      return res.status(400).json({ success: false, message: `License key is already ${key.status}.` });
    }

    const now = new Date();
    const expires = new Date(now);
    if (key.duration === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    // Create payment record
    const payment = await Payment.create({
      user_id: req.user.id,
      plan_name: key.plan_name,
      duration: key.duration,
      amount: 0,
      payment_gateway: 'license_key',
      status: 'completed',
      license_key_id: key.id,
    });

    // Create subscription
    await UserSubscription.create({
      user_id: req.user.id,
      plan_name: key.plan_name,
      duration: key.duration,
      status: 'active',
      starts_at: now,
      expires_at: expires,
      payment_id: payment.id,
      license_key_id: key.id,
    });

    // Mark key as active
    await key.update({ status: 'active', activated_by: req.user.id, activated_at: now, expires_at: expires });

    // Update user subscription_plan
    const validPlans = ['free', 'basic', 'pro', 'enterprise'];
    const planName = validPlans.includes(key.plan_name) ? key.plan_name : 'basic';
    await User.update({ subscription_plan: planName }, { where: { id: req.user.id } });

    res.json({ success: true, message: 'License key activated successfully!', plan: key.plan_name, expires_at: expires });
  } catch (err) {
    console.error('Activate key error:', err);
    res.status(500).json({ success: false, message: 'Failed to activate license key.' });
  }
});

// GET /api/subscription/history
router.get('/history', async (req, res) => {
  try {
    const history = await UserSubscription.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 20,
    });
    res.json({ success: true, history });
  } catch (err) {
    console.error('Subscription history error:', err);
    res.status(500).json({ success: false, message: 'Failed to load history.' });
  }
});

module.exports = router;
