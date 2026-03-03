const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { SourcingCalculation } = require('../models/Sourcing');

const SHIPPING_RATES = {
  sea: { perKg: 0.5, minDays: 25, maxDays: 45 },
  air: { perKg: 4.5, minDays: 7, maxDays: 14 },
  express: { perKg: 8.0, minDays: 3, maxDays: 7 },
};

const DUTY_RATES = {
  US: { general: 5, electronics: 3, clothing: 12, toys: 0, home: 4 },
  UK: { general: 4, electronics: 2.5, clothing: 12, toys: 0, home: 3.5 },
  IN: { general: 10, electronics: 10, clothing: 20, toys: 10, home: 10 },
  AE: { general: 5, electronics: 5, clothing: 5, toys: 5, home: 5 },
  DE: { general: 4, electronics: 2.5, clothing: 12, toys: 0, home: 3.5 },
};

// POST /api/sourcing/calculate
router.post('/calculate', auth, async (req, res) => {
  try {
    const {
      product_name, source_country, destination_country, unit_cost,
      units_per_order, shipping_method, weight_per_unit,
      customs_duty_percent, amazon_referral_percent,
      fba_fee_per_unit, target_sell_price, notes,
    } = req.body;

    const cost = parseFloat(unit_cost) || 0;
    const units = parseInt(units_per_order) || 500;
    const weight = parseFloat(weight_per_unit) || 0.5;
    const method = shipping_method || 'sea';
    const sellPrice = parseFloat(target_sell_price) || 0;
    const referral = parseFloat(amazon_referral_percent) || 15;
    const fba = parseFloat(fba_fee_per_unit) || 0;
    const duty = parseFloat(customs_duty_percent) || DUTY_RATES[destination_country]?.general || 5;

    const shippingRate = SHIPPING_RATES[method] || SHIPPING_RATES.sea;
    const shippingPerUnit = weight * shippingRate.perKg;
    const dutyPerUnit = cost * (duty / 100);
    const totalLandedCost = cost + shippingPerUnit + dutyPerUnit;
    const referralFee = sellPrice * (referral / 100);
    const totalCostPerUnit = totalLandedCost + referralFee + fba;
    const profitPerUnit = sellPrice - totalCostPerUnit;
    const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice * 100) : 0;
    const roi = totalCostPerUnit > 0 ? (profitPerUnit / totalCostPerUnit * 100) : 0;
    const totalInvestment = totalLandedCost * units;
    const totalRevenue = sellPrice * units;
    const totalProfit = profitPerUnit * units;
    const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(totalInvestment / profitPerUnit) : 0;

    // Save
    const calc = await SourcingCalculation.create({
      user_id: req.user.id, product_name, source_country: source_country || 'China',
      destination_country: destination_country || 'US', unit_cost: cost,
      units_per_order: units, shipping_method: method,
      shipping_cost_per_unit: Math.round(shippingPerUnit * 100) / 100,
      customs_duty_percent: duty, amazon_referral_percent: referral,
      fba_fee_per_unit: fba, target_sell_price: sellPrice, notes,
    });

    res.json({
      success: true,
      calculation: {
        id: calc.id, product_name,
        costBreakdown: {
          unitCost: Math.round(cost * 100) / 100,
          shippingPerUnit: Math.round(shippingPerUnit * 100) / 100,
          dutyPerUnit: Math.round(dutyPerUnit * 100) / 100,
          totalLandedCost: Math.round(totalLandedCost * 100) / 100,
          referralFee: Math.round(referralFee * 100) / 100,
          fbaFee: fba,
          totalCostPerUnit: Math.round(totalCostPerUnit * 100) / 100,
        },
        profitability: {
          sellPrice, profitPerUnit: Math.round(profitPerUnit * 100) / 100,
          profitMargin: Math.round(profitMargin * 10) / 10,
          roi: Math.round(roi * 10) / 10,
        },
        orderSummary: {
          units, totalInvestment: Math.round(totalInvestment),
          totalRevenue: Math.round(totalRevenue),
          totalProfit: Math.round(totalProfit),
          breakEvenUnits,
        },
        shipping: {
          method, estimatedDays: `${shippingRate.minDays}-${shippingRate.maxDays} days`,
          ratePerKg: shippingRate.perKg,
        },
      },
    });
  } catch (err) {
    console.error('Sourcing calc error:', err);
    res.status(500).json({ success: false, message: 'Calculation failed.' });
  }
});

// GET /api/sourcing/history
router.get('/history', auth, async (req, res) => {
  try {
    const calcs = await SourcingCalculation.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, calculations: calcs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// DELETE /api/sourcing/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await SourcingCalculation.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;
