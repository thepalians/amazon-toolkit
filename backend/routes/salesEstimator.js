const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * =============================================
 * SALES ESTIMATOR (BSR) API
 * =============================================
 * Estimates monthly sales from Amazon BSR
 * using category-specific algorithms.
 * Based on Jungle Scout / Helium10 methodology.
 * =============================================
 */

// BSR to Sales conversion curves per category per marketplace
// Formula: estimatedSales = (categoryBase / BSR^exponent) * seasonalMultiplier
const CATEGORY_CURVES = {
  US: {
    'All Departments':      { base: 250000, exponent: 0.80 },
    'Electronics':          { base: 120000, exponent: 0.78 },
    'Books':                { base: 200000, exponent: 0.82 },
    'Clothing':             { base: 180000, exponent: 0.79 },
    'Home & Kitchen':       { base: 170000, exponent: 0.80 },
    'Sports & Outdoors':    { base: 130000, exponent: 0.78 },
    'Health & Household':   { base: 150000, exponent: 0.79 },
    'Beauty & Personal Care': { base: 140000, exponent: 0.78 },
    'Toys & Games':         { base: 160000, exponent: 0.80 },
    'Automotive':           { base: 100000, exponent: 0.77 },
    'Pet Supplies':         { base: 110000, exponent: 0.78 },
    'Baby':                 { base: 120000, exponent: 0.79 },
    'Grocery':              { base: 90000,  exponent: 0.76 },
    'Tools & Home Improvement': { base: 110000, exponent: 0.77 },
    'Garden & Outdoor':     { base: 100000, exponent: 0.77 },
    'Office Products':      { base: 80000,  exponent: 0.75 },
    'Arts, Crafts & Sewing': { base: 70000, exponent: 0.74 },
    'Industrial & Scientific': { base: 60000, exponent: 0.73 },
    'Musical Instruments':  { base: 40000,  exponent: 0.70 },
    'Video Games':          { base: 80000,  exponent: 0.76 },
  },
  IN: {
    'All Departments':      { base: 80000,  exponent: 0.78 },
    'Electronics':          { base: 60000,  exponent: 0.76 },
    'Books':                { base: 70000,  exponent: 0.79 },
    'Clothing & Accessories': { base: 90000, exponent: 0.80 },
    'Home & Kitchen':       { base: 65000,  exponent: 0.77 },
    'Health & Personal Care': { base: 50000, exponent: 0.75 },
    'Beauty':               { base: 55000,  exponent: 0.76 },
    'Sports & Fitness':     { base: 40000,  exponent: 0.74 },
    'Toys & Games':         { base: 45000,  exponent: 0.75 },
    'Grocery & Gourmet':    { base: 35000,  exponent: 0.73 },
    'Automotive':           { base: 30000,  exponent: 0.72 },
    'Baby':                 { base: 35000,  exponent: 0.73 },
    'Pet Supplies':         { base: 25000,  exponent: 0.70 },
    'Computers & Accessories': { base: 50000, exponent: 0.75 },
    'Office Products':      { base: 30000,  exponent: 0.72 },
    'Industrial & Scientific': { base: 20000, exponent: 0.68 },
    'Musical Instruments':  { base: 15000,  exponent: 0.65 },
    'Garden & Outdoors':    { base: 25000,  exponent: 0.70 },
  },
  UK: {
    'All Departments':      { base: 150000, exponent: 0.79 },
    'Electronics':          { base: 90000,  exponent: 0.77 },
    'Books':                { base: 130000, exponent: 0.80 },
    'Clothing':             { base: 110000, exponent: 0.78 },
    'Home & Kitchen':       { base: 100000, exponent: 0.78 },
    'Health & Beauty':      { base: 80000,  exponent: 0.76 },
    'Sports & Outdoors':    { base: 70000,  exponent: 0.75 },
    'Toys & Games':         { base: 90000,  exponent: 0.77 },
    'Automotive':           { base: 60000,  exponent: 0.74 },
    'Pet Supplies':         { base: 65000,  exponent: 0.75 },
    'Baby':                 { base: 70000,  exponent: 0.76 },
    'Garden & Outdoors':    { base: 55000,  exponent: 0.74 },
    'Office Products':      { base: 50000,  exponent: 0.73 },
  },
  AE: {
    'All Departments':      { base: 30000,  exponent: 0.72 },
    'Electronics':          { base: 20000,  exponent: 0.70 },
    'Fashion':              { base: 25000,  exponent: 0.71 },
    'Home':                 { base: 18000,  exponent: 0.69 },
    'Health & Beauty':      { base: 15000,  exponent: 0.68 },
    'Sports':               { base: 12000,  exponent: 0.66 },
    'Toys':                 { base: 10000,  exponent: 0.65 },
    'Baby':                 { base: 8000,   exponent: 0.63 },
    'Automotive':           { base: 8000,   exponent: 0.63 },
  },
};

// Seasonal multipliers by month
const SEASONAL_MULTIPLIERS = {
  1: 0.85, 2: 0.80, 3: 0.90, 4: 0.95, 5: 1.00, 6: 1.00,
  7: 0.95, 8: 0.90, 9: 1.00, 10: 1.15, 11: 1.40, 12: 1.60,
};

// Indian festivals/seasons
const SEASONAL_MULTIPLIERS_IN = {
  1: 0.80, 2: 0.85, 3: 0.90, 4: 0.85, 5: 0.85, 6: 0.90,
  7: 0.95, 8: 1.00, 9: 1.10, 10: 1.50, 11: 1.30, 12: 1.00,
};

function estimateSales(bsr, category, countryCode, price) {
  const cc = (countryCode || 'US').toUpperCase();
  const curves = CATEGORY_CURVES[cc] || CATEGORY_CURVES['US'];
  const curve = curves[category] || curves['All Departments'];

  if (!bsr || bsr <= 0) {
    return { error: 'BSR must be greater than 0.' };
  }

  // Core calculation
  const rawMonthlySales = Math.round(curve.base / Math.pow(bsr, curve.exponent));

  // Seasonal adjustment
  const month = new Date().getMonth() + 1;
  const seasonalMultipliers = cc === 'IN' ? SEASONAL_MULTIPLIERS_IN : SEASONAL_MULTIPLIERS;
  const seasonalMultiplier = seasonalMultipliers[month] || 1.0;
  const adjustedMonthlySales = Math.round(rawMonthlySales * seasonalMultiplier);

  // Daily sales
  const dailySales = Math.round((adjustedMonthlySales / 30) * 10) / 10;

  // Revenue estimates
  const priceNum = parseFloat(price) || 0;
  const monthlyRevenue = Math.round(adjustedMonthlySales * priceNum);
  const yearlyRevenue = monthlyRevenue * 12;

  // Sales velocity rating
  let velocityRating = 'Low';
  let velocityColor = '#ef4444';
  if (adjustedMonthlySales >= 1000) { velocityRating = 'Very High 🔥'; velocityColor = '#22c55e'; }
  else if (adjustedMonthlySales >= 500) { velocityRating = 'High'; velocityColor = '#22c55e'; }
  else if (adjustedMonthlySales >= 100) { velocityRating = 'Medium'; velocityColor = '#f59e0b'; }
  else if (adjustedMonthlySales >= 30) { velocityRating = 'Low-Medium'; velocityColor = '#f97316'; }

  // Competition level based on BSR
  let competition = 'Low';
  let competitionColor = '#22c55e';
  if (bsr <= 1000) { competition = 'Extremely High 🔴'; competitionColor = '#ef4444'; }
  else if (bsr <= 5000) { competition = 'Very High'; competitionColor = '#ef4444'; }
  else if (bsr <= 20000) { competition = 'High'; competitionColor = '#f97316'; }
  else if (bsr <= 50000) { competition = 'Medium'; competitionColor = '#f59e0b'; }
  else if (bsr <= 100000) { competition = 'Low-Medium'; competitionColor = '#84cc16'; }

  // BSR range estimate (±15%)
  const salesLow = Math.round(adjustedMonthlySales * 0.85);
  const salesHigh = Math.round(adjustedMonthlySales * 1.15);

  return {
    bsr,
    category,
    countryCode: cc,
    price: priceNum,
    seasonalMultiplier,
    currentMonth: month,
    estimates: {
      dailySales,
      monthlySales: adjustedMonthlySales,
      rawMonthlySales,
      salesRange: { low: salesLow, high: salesHigh },
      monthlyRevenue,
      yearlyRevenue,
    },
    analysis: {
      velocityRating,
      velocityColor,
      competition,
      competitionColor,
    },
    formula: {
      base: curve.base,
      exponent: curve.exponent,
      equation: `${curve.base} / BSR^${curve.exponent} × ${seasonalMultiplier} (seasonal)`,
    },
  };
}

// POST /api/sales-estimator/estimate
router.post('/estimate', auth, (req, res) => {
  try {
    const { bsr, category, countryCode, price } = req.body;
    if (!bsr || bsr <= 0) {
      return res.status(400).json({ success: false, message: 'Valid BSR is required.' });
    }
    const result = estimateSales(parseInt(bsr), category, countryCode, price);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Sales estimate error:', err);
    res.status(500).json({ success: false, message: 'Estimation failed.' });
  }
});

// GET /api/sales-estimator/categories/:countryCode
router.get('/categories/:countryCode', auth, (req, res) => {
  const cc = (req.params.countryCode || 'US').toUpperCase();
  const curves = CATEGORY_CURVES[cc] || CATEGORY_CURVES['US'];
  const categories = Object.keys(curves).map(name => ({
    name,
    base: curves[name].base,
    exponent: curves[name].exponent,
  }));
  res.json({ success: true, countryCode: cc, categories });
});

// POST /api/sales-estimator/bulk — estimate multiple BSRs at once
router.post('/bulk', auth, (req, res) => {
  try {
    const { items, countryCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array required.' });
    }
    if (items.length > 20) {
      return res.status(400).json({ success: false, message: 'Maximum 20 items per request.' });
    }
    const results = items.map(item =>
      estimateSales(parseInt(item.bsr), item.category, countryCode || item.countryCode, item.price)
    );
    res.json({ success: true, results });
  } catch (err) {
    console.error('Bulk estimate error:', err);
    res.status(500).json({ success: false, message: 'Bulk estimation failed.' });
  }
});

module.exports = router;
