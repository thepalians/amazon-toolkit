/**
 * CURRENCY ROUTES (public)
 * GET /api/currency/rates — Returns live INR exchange rates, cached 1 hour
 */
const express = require('express');
const router = express.Router();
const { getINRRates } = require('../services/currencyService');

router.get('/rates', async (req, res) => {
  const result = await getINRRates();
  res.json({
    success: true,
    base: 'INR',
    rates: result.rates,
    cached: result.cached,
    updated_at: result.updatedAt ? new Date(result.updatedAt).toISOString() : null,
    ...(result.fallback ? { fallback: true } : {}),
  });
});

module.exports = router;
