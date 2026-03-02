/**
 * KEYWORD RESEARCH ROUTES
 * POST /api/keywords/research
 * GET  /api/keywords/history
 * DELETE /api/keywords/:id
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const KeywordScraper = require('../services/keywordScraper');
const { getCountryConfig, detectCountry } = require('../services/countryConfig');
const Keyword = require('../models/Keyword');

// ---- Research Keywords ----
router.post('/research', authMiddleware, async (req, res) => {
  try {
    const { keyword, includeAlphabet = false, maxResults = 50 } = req.body;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Keyword must be at least 2 characters.' });
    }

    const countryCode = req.body.countryCode || detectCountry(req);
    const countryConfig = await getCountryConfig(countryCode);

    const suggestions = await KeywordScraper.research(
      keyword.trim(),
      countryCode,
      countryConfig,
      { includeAlphabet, maxResults }
    );

    // Save to DB (bulk insert)
    const toSave = suggestions.map((s) => ({
      user_id: req.user.id,
      seed_keyword: keyword.trim(),
      related_keyword: s.keyword,
      search_volume_estimate: s.searchVolumeEstimate,
      competition_level: s.competitionLevel,
      country_code: countryCode,
      marketplace: countryConfig.marketplace,
      suggestion_source: s.source || 'amazon_autocomplete',
      trending_score: s.trendingScore || 0,
    }));

    await Keyword.bulkCreate(toSave, { ignoreDuplicates: true });

    res.json({
      success: true,
      keyword,
      countryCode,
      marketplace: countryConfig.marketplace,
      total: suggestions.length,
      suggestions,
    });
  } catch (err) {
    console.error('Keyword research error:', err);
    res.status(500).json({ success: false, message: 'Keyword research failed.' });
  }
});

// ---- History ----
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const keywords = await Keyword.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({ success: true, keywords });
  } catch (err) {
    console.error('Keyword history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
});

// ---- Delete ----
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Keyword.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Keyword not found.' });
    res.json({ success: true, message: 'Keyword deleted.' });
  } catch (err) {
    console.error('Keyword delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete keyword.' });
  }
});

module.exports = router;
