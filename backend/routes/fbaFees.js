const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * =============================================
 * FBA FEE BREAKDOWN API
 * =============================================
 * Calculates detailed Amazon FBA fees:
 * - Referral Fee (by category)
 * - FBA Fulfillment Fee (by size/weight)
 * - Storage Fee (monthly/long-term)
 * - Closing Fee (media items)
 * - GST/VAT on fees
 * =============================================
 */

// FBA Size Tiers (US marketplace - approximate)
const SIZE_TIERS = {
  US: [
    { name: 'Small Standard', maxWeight: 0.75, maxLength: 15, maxWidth: 12, maxHeight: 0.75, fulfillmentFee: 3.22 },
    { name: 'Large Standard', maxWeight: 20, maxLength: 18, maxWidth: 14, maxHeight: 8, fulfillmentFee: 5.40 },
    { name: 'Small Oversize', maxWeight: 70, maxLength: 60, maxWidth: 30, maxHeight: 30, fulfillmentFee: 9.73 },
    { name: 'Medium Oversize', maxWeight: 150, maxLength: 108, maxWidth: 60, maxHeight: 60, fulfillmentFee: 19.05 },
    { name: 'Large Oversize', maxWeight: 150, maxLength: 108, maxWidth: 60, maxHeight: 60, fulfillmentFee: 89.98 },
  ],
  IN: [
    { name: 'Standard - Light', maxWeight: 0.5, maxLength: 38, maxWidth: 25, maxHeight: 10, fulfillmentFee: 29 },
    { name: 'Standard - Medium', maxWeight: 1, maxLength: 38, maxWidth: 25, maxHeight: 10, fulfillmentFee: 40 },
    { name: 'Standard - Heavy', maxWeight: 5, maxLength: 45, maxWidth: 34, maxHeight: 20, fulfillmentFee: 55 },
    { name: 'Standard - Heavier', maxWeight: 12, maxLength: 63, maxWidth: 42, maxHeight: 33, fulfillmentFee: 80 },
    { name: 'Oversize', maxWeight: 22.5, maxLength: 120, maxWidth: 60, maxHeight: 60, fulfillmentFee: 130 },
    { name: 'Heavy & Bulky', maxWeight: 50, maxLength: 180, maxWidth: 120, maxHeight: 90, fulfillmentFee: 200 },
  ],
  UK: [
    { name: 'Small Envelope', maxWeight: 0.08, maxLength: 20, maxWidth: 15, maxHeight: 1, fulfillmentFee: 1.71 },
    { name: 'Standard Envelope', maxWeight: 0.46, maxLength: 33, maxWidth: 23, maxHeight: 2.5, fulfillmentFee: 2.12 },
    { name: 'Small Parcel', maxWeight: 3, maxLength: 35, maxWidth: 25, maxHeight: 12, fulfillmentFee: 3.77 },
    { name: 'Standard Parcel', maxWeight: 12, maxLength: 45, maxWidth: 34, maxHeight: 26, fulfillmentFee: 5.33 },
    { name: 'Small Oversize', maxWeight: 25, maxLength: 61, maxWidth: 46, maxHeight: 46, fulfillmentFee: 7.06 },
    { name: 'Large Oversize', maxWeight: 30, maxLength: 120, maxWidth: 60, maxHeight: 60, fulfillmentFee: 13.37 },
  ],
  AE: [
    { name: 'Standard - Small', maxWeight: 0.5, maxLength: 30, maxWidth: 20, maxHeight: 8, fulfillmentFee: 7 },
    { name: 'Standard - Medium', maxWeight: 2, maxLength: 45, maxWidth: 34, maxHeight: 20, fulfillmentFee: 12 },
    { name: 'Standard - Large', maxWeight: 10, maxLength: 60, maxWidth: 40, maxHeight: 30, fulfillmentFee: 20 },
    { name: 'Oversize', maxWeight: 30, maxLength: 120, maxWidth: 60, maxHeight: 60, fulfillmentFee: 40 },
  ],
};

// Referral Fee Rates by Category (percentage)
const REFERRAL_RATES = {
  general: 15,
  electronics: 8,
  computers: 8,
  books: 15,
  clothing: 17,
  shoes: 15,
  jewelry: 20,
  watches: 16,
  grocery: 8,
  health: 8,
  beauty: 8,
  toys: 15,
  sports: 15,
  automotive: 12,
  home: 15,
  garden: 15,
  kitchen: 15,
  tools: 15,
  pet: 15,
  baby: 8,
  furniture: 15,
  appliances: 8,
  music: 15,
  video_games: 15,
  software: 15,
  office: 15,
  industrial: 12,
  luggage: 15,
};

// Storage Fees (per cubic foot per month)
const STORAGE_FEES = {
  US: { standard: 0.87, peak: 2.40, longTerm: 6.90 },
  IN: { standard: 45, peak: 45, longTerm: 120 },
  UK: { standard: 0.75, peak: 1.85, longTerm: 4.30 },
  AE: { standard: 2.5, peak: 5.0, longTerm: 10.0 },
};

// GST/VAT rates on fees
const TAX_ON_FEES = {
  US: 0,
  IN: 18,
  UK: 20,
  AE: 5,
  DE: 19,
  FR: 20,
  CA: 5,
  AU: 10,
  JP: 10,
};

// Closing Fee (for media categories)
const CLOSING_FEE = {
  US: 1.80,
  IN: 5,
  UK: 0.50,
  AE: 2,
};

const MEDIA_CATEGORIES = ['books', 'music', 'video_games', 'software'];

function determineSizeTier(weight, length, width, height, countryCode) {
  const tiers = SIZE_TIERS[countryCode] || SIZE_TIERS['US'];
  for (const tier of tiers) {
    if (weight <= tier.maxWeight && length <= tier.maxLength && width <= tier.maxWidth && height <= tier.maxHeight) {
      return tier;
    }
  }
  return tiers[tiers.length - 1]; // Largest tier
}

function calculateFBAFees(data) {
  const {
    sellingPrice = 0,
    costPrice = 0,
    category = 'general',
    weight = 0.5,
    length = 10,
    width = 10,
    height = 5,
    countryCode = 'US',
    storageDuration = 'standard', // standard, peak, longTerm
    unitsPerMonth = 1,
  } = data;

  const cc = countryCode.toUpperCase();
  const currency = { US: 'USD', IN: 'INR', UK: 'GBP', AE: 'AED', DE: 'EUR', FR: 'EUR', CA: 'CAD', AU: 'AUD', JP: 'JPY' }[cc] || 'USD';
  const currencySymbol = { USD: '$', INR: '₹', GBP: '£', AED: 'AED ', EUR: '€', CAD: 'C$', AUD: 'A$', JPY: '¥' }[currency] || '$';

  const result = {
    currency,
    currencySymbol,
    sellingPrice: parseFloat(sellingPrice),
    costPrice: parseFloat(costPrice),
    fees: [],
    totalFees: 0,
    totalFeesWithTax: 0,
    netProfit: 0,
    profitMargin: 0,
    roi: 0,
    sizeTier: null,
  };

  // 1. Referral Fee
  const referralRate = REFERRAL_RATES[category] || REFERRAL_RATES['general'];
  const referralFee = (sellingPrice * referralRate) / 100;
  result.fees.push({
    name: 'Referral Fee',
    description: `${referralRate}% of selling price (${category})`,
    amount: round2(referralFee),
    rate: `${referralRate}%`,
    icon: '📦',
  });

  // 2. FBA Fulfillment Fee
  const sizeTier = determineSizeTier(weight, length, width, height, cc);
  result.sizeTier = sizeTier.name;

  // Weight-based adjustment
  let fulfillmentFee = sizeTier.fulfillmentFee;
  if (weight > 1 && cc === 'US') {
    fulfillmentFee += Math.ceil(weight - 1) * 0.40; // extra weight surcharge
  } else if (weight > 0.5 && cc === 'IN') {
    fulfillmentFee += Math.ceil((weight - 0.5) / 0.5) * 10; // per 500g extra in India
  }
  result.fees.push({
    name: 'FBA Fulfillment Fee',
    description: `Size: ${sizeTier.name} | Weight: ${weight}kg`,
    amount: round2(fulfillmentFee),
    rate: 'Fixed + weight',
    icon: '🚚',
  });

  // 3. Storage Fee
  const cubicFeet = (length * width * height) / 1728; // inches to cubic feet
  const cubicFeetMetric = (length * width * height) / 28316.8; // cm to cubic feet
  const cf = cc === 'US' ? cubicFeet : cubicFeetMetric;
  const storageFees = STORAGE_FEES[cc] || STORAGE_FEES['US'];
  const storageRate = storageFees[storageDuration] || storageFees.standard;
  const storageFee = cf * storageRate * unitsPerMonth;
  result.fees.push({
    name: 'Storage Fee',
    description: `${storageDuration} rate | ${cf.toFixed(3)} cu.ft × ${currencySymbol}${storageRate}/month`,
    amount: round2(storageFee),
    rate: `${currencySymbol}${storageRate}/cu.ft`,
    icon: '🏭',
  });

  // 4. Closing Fee (media only)
  let closingFee = 0;
  if (MEDIA_CATEGORIES.includes(category)) {
    closingFee = CLOSING_FEE[cc] || CLOSING_FEE['US'];
    result.fees.push({
      name: 'Closing Fee',
      description: `Media category (${category})`,
      amount: round2(closingFee),
      rate: 'Fixed',
      icon: '🎬',
    });
  }

  // 5. Total Fees
  const totalFees = referralFee + fulfillmentFee + storageFee + closingFee;
  result.totalFees = round2(totalFees);

  // 6. Tax on Fees (GST/VAT)
  const taxRate = TAX_ON_FEES[cc] || 0;
  const taxOnFees = (totalFees * taxRate) / 100;
  if (taxRate > 0) {
    result.fees.push({
      name: `Tax on Fees (${taxRate}% ${cc === 'IN' ? 'GST' : 'VAT'})`,
      description: `${taxRate}% on total Amazon fees`,
      amount: round2(taxOnFees),
      rate: `${taxRate}%`,
      icon: '🏛️',
    });
  }
  result.totalFeesWithTax = round2(totalFees + taxOnFees);

  // 7. Profit Calculation
  result.netProfit = round2(sellingPrice - costPrice - totalFees - taxOnFees);
  result.profitMargin = sellingPrice > 0 ? round2((result.netProfit / sellingPrice) * 100) : 0;
  result.roi = costPrice > 0 ? round2((result.netProfit / costPrice) * 100) : 0;

  // 8. Summary
  result.summary = {
    sellingPrice: round2(sellingPrice),
    costPrice: round2(costPrice),
    totalAmazonFees: result.totalFeesWithTax,
    netProfit: result.netProfit,
    profitMargin: result.profitMargin,
    roi: result.roi,
    profitable: result.netProfit > 0,
  };

  return result;
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

// POST /api/fba-fees/calculate
router.post('/calculate', auth, (req, res) => {
  try {
    const result = calculateFBAFees(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('FBA fee calc error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate FBA fees.' });
  }
});

// GET /api/fba-fees/categories
router.get('/categories', auth, (req, res) => {
  res.json({
    success: true,
    categories: Object.keys(REFERRAL_RATES).map(key => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      rate: REFERRAL_RATES[key],
    })),
  });
});

// GET /api/fba-fees/size-tiers/:countryCode
router.get('/size-tiers/:countryCode', auth, (req, res) => {
  const cc = (req.params.countryCode || 'US').toUpperCase();
  const tiers = SIZE_TIERS[cc] || SIZE_TIERS['US'];
  res.json({ success: true, countryCode: cc, tiers });
});

module.exports = router;
