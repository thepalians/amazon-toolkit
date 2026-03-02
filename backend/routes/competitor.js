/**
 * COMPETITOR MONITOR ROUTES
 * POST   /api/competitor/track
 * GET    /api/competitor/list
 * POST   /api/competitor/:id/check
 * GET    /api/competitor/:id/history
 * DELETE /api/competitor/:id
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const CompetitorMonitor = require('../services/competitorMonitor');
const { getCountryConfig, detectCountry } = require('../services/countryConfig');
const { CompetitorTracking } = require('../models/Competitor');

// ---- Add tracking ----
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { asin, countryCode: bodyCountry, intervalHours } = req.body;

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid ASIN (10 chars) required.' });
    }

    const countryCode = (bodyCountry || detectCountry(req)).toUpperCase();
    const countryConfig = await getCountryConfig(countryCode);

    const tracking = await CompetitorMonitor.addTracking(
      req.user.id,
      asin.toUpperCase(),
      countryCode,
      countryConfig.marketplace,
      { intervalHours }
    );

    res.status(201).json({ success: true, tracking });
  } catch (err) {
    console.error('Competitor track error:', err);
    res.status(500).json({ success: false, message: 'Failed to add tracking.' });
  }
});

// ---- List tracked ASINs ----
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const items = await CompetitorTracking.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, items });
  } catch (err) {
    console.error('Competitor list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tracking list.' });
  }
});

// ---- Manual price check ----
router.post('/:id/check', authMiddleware, async (req, res) => {
  try {
    const tracking = await CompetitorTracking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Tracking record not found.' });
    }

    const countryConfig = await getCountryConfig(tracking.country_code);
    const data = await CompetitorMonitor.runPriceCheck(tracking, countryConfig);

    res.json({ success: true, data });
  } catch (err) {
    console.error('Competitor check error:', err);
    res.status(500).json({ success: false, message: 'Price check failed.', detail: err.message });
  }
});

// ---- Price history ----
router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const tracking = await CompetitorTracking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Tracking record not found.' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const history = await CompetitorMonitor.getPriceHistory(tracking.id, limit);

    res.json({ success: true, asin: tracking.asin, history });
  } catch (err) {
    console.error('Competitor history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
});

// ---- Remove tracking ----
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await CompetitorTracking.update(
      { is_active: false },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    if (!updated[0]) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'Tracking removed.' });
  } catch (err) {
    console.error('Competitor delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove tracking.' });
  }
});

module.exports = router;
