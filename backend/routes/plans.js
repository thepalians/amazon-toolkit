/**
 * PLAN ROUTES (public)
 * GET /api/plans        - list all active plans
 * GET /api/plans/:name  - get plan details
 */
const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');

router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
    });
    res.json({ success: true, plans });
  } catch (err) {
    console.error('Plans list error:', err);
    res.status(500).json({ success: false, message: 'Failed to load plans.' });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOne({ where: { name: req.params.name, is_active: true } });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Plan detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to load plan.' });
  }
});

module.exports = router;
