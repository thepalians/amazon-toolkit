const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * BULK OPERATIONS API
 * - Bulk ASIN lookup
 * - Bulk keyword check
 * - Bulk profit calculation
 */

// Helper: scrape basic product info
async function scrapeProduct(asin, countryCode) {
  const marketplaces = {
    US: 'https://www.amazon.com', IN: 'https://www.amazon.in', UK: 'https://www.amazon.co.uk',
    AE: 'https://www.amazon.ae', DE: 'https://www.amazon.de', FR: 'https://www.amazon.fr',
    CA: 'https://www.amazon.ca', AU: 'https://www.amazon.com.au', JP: 'https://www.amazon.co.jp',
  };
  const base = marketplaces[countryCode] || marketplaces.US;

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    const res = await axios.get(`${base}/dp/${asin}`, { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);

    const title = $('#productTitle').text().trim() || '';
    const priceText = $('.a-price .a-offscreen').first().text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    const rating = parseFloat($('.a-icon-alt').first().text()) || 0;
    const reviews = parseInt($('#acrCustomerReviewCount').text().replace(/[^0-9]/g, '')) || 0;
    const bsrText = $('th:contains("Best Sellers Rank"), td:contains("Best Sellers Rank")').parent().text();
    const bsrMatch = bsrText.match(/#([\d,]+)/);
    const bsr = bsrMatch ? parseInt(bsrMatch[1].replace(/,/g, '')) : 0;

    return { asin, title: title.substring(0, 150), price, rating, reviews, bsr, found: true };
  } catch {
    return { asin, title: '', price: 0, rating: 0, reviews: 0, bsr: 0, found: false };
  }
}

// POST /api/bulk/asin-lookup — max 10 ASINs
router.post('/asin-lookup', auth, async (req, res) => {
  try {
    const { asins, countryCode } = req.body;
    if (!asins || !Array.isArray(asins) || asins.length === 0) {
      return res.status(400).json({ success: false, message: 'ASINs array required.' });
    }
    if (asins.length > 10) {
      return res.status(400).json({ success: false, message: 'Max 10 ASINs per request.' });
    }

    const results = [];
    for (const asin of asins) {
      const data = await scrapeProduct(asin.trim().toUpperCase(), countryCode || 'US');
      results.push(data);
      await new Promise(r => setTimeout(r, 1500));
    }

    res.json({ success: true, results, total: results.length, found: results.filter(r => r.found).length });
  } catch (err) {
    console.error('Bulk lookup error:', err);
    res.status(500).json({ success: false, message: 'Bulk lookup failed.' });
  }
});

// POST /api/bulk/profit-calc — bulk profit calculation
router.post('/profit-calc', auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array required.' });
    }
    if (items.length > 50) {
      return res.status(400).json({ success: false, message: 'Max 50 items per request.' });
    }

    const results = items.map(item => {
      const sell = parseFloat(item.sellPrice) || 0;
      const cost = parseFloat(item.costPrice) || 0;
      const fbaPercent = parseFloat(item.fbaPercent) || 15;
      const shipping = parseFloat(item.shipping) || 0;

      const fba = sell * (fbaPercent / 100);
      const totalCost = cost + fba + shipping;
      const profit = sell - totalCost;
      const margin = sell > 0 ? Math.round((profit / sell) * 10000) / 100 : 0;
      const roi = totalCost > 0 ? Math.round((profit / totalCost) * 10000) / 100 : 0;

      return {
        ...item, fbaFee: Math.round(fba * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        profit: Math.round(profit * 100) / 100, margin, roi,
        profitable: profit > 0,
      };
    });

    const totalProfit = results.reduce((s, r) => s + r.profit, 0);
    const profitableCount = results.filter(r => r.profitable).length;

    res.json({ success: true, results, summary: { total: results.length, profitable: profitableCount, totalProfit: Math.round(totalProfit * 100) / 100 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bulk calc failed.' });
  }
});

module.exports = router;
