/**
 * PROFIT CALCULATOR ROUTES
 * POST /api/profit/calculate
 * POST /api/profit/compare
 * GET  /api/profit/history
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const ProfitCalculator = require('../services/profitCalculator');
const { detectCountry } = require('../services/countryConfig');
const Product = require('../models/Product');

// ---- Calculate Profit ----
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const countryCode = detectCountry(req);

    const result = await ProfitCalculator.calculate({
      ...req.body,
      countryCode: req.body.countryCode || countryCode,
    });

    // Optionally save product calculation
    if (req.body.saveResult) {
      await Product.create({
        user_id: req.user.id,
        asin: req.body.asin || null,
        title: req.body.title || null,
        category: req.body.category || null,
        buy_price: req.body.buyPrice,
        sell_price: req.body.sellPrice,
        weight_kg: req.body.weightKg,
        country_code: result.country.code,
        marketplace: result.country.marketplace,
        profit_amount: result.profit.profitPerUnit,
        profit_margin: result.profit.profitMargin,
        roi: result.profit.roi,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Profit calculate error:', err);
    res.status(500).json({ success: false, message: 'Calculation failed.' });
  }
});

// ---- Compare across countries ----
router.post('/compare', authMiddleware, async (req, res) => {
  try {
    const { countryCodes = ['US', 'IN', 'SA', 'GB', 'DE'], ...params } = req.body;
    const results = await ProfitCalculator.compareCountries(params, countryCodes);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Profit compare error:', err);
    res.status(500).json({ success: false, message: 'Comparison failed.' });
  }
});

// ---- History ----
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const products = await Product.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({ success: true, products });
  } catch (err) {
    console.error('Profit history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
});

module.exports = router;
