/**
 * LISTING OPTIMIZER ROUTES
 * POST /api/listing/optimize
 * GET  /api/listing/history
 * DELETE /api/listing/:id
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const ListingOptimizer = require('../services/listingOptimizer');
const { getCountryConfig, detectCountry } = require('../services/countryConfig');
const { sequelize } = require('../config/database');

// ---- Optimize Listing ----
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.' });
    }

    const countryCode = req.body.countryCode || detectCountry(req);
    const countryConfig = await getCountryConfig(countryCode);

    const result = await ListingOptimizer.optimize({
      ...req.body,
      countryCode,
      countryConfig,
    });

    // Save optimization to DB
    await sequelize.query(
      `INSERT INTO listing_optimizations
        (user_id, original_title, optimized_title, original_description, optimized_description,
         original_bullets, optimized_bullets, backend_keywords, optimization_score, ai_model_used,
         country_code, language_used, tokens_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          req.user.id,
          req.body.title || '',
          result.optimizedTitle,
          req.body.description || '',
          result.optimizedDescription,
          JSON.stringify(req.body.bullets || []),
          JSON.stringify(result.optimizedBullets),
          JSON.stringify(result.backendKeywords),
          result.optimizationScore,
          result.aiModel,
          countryCode,
          result.language,
          result.tokensUsed,
        ],
      }
    );

    res.json(result);
  } catch (err) {
    console.error('Listing optimize error:', err);
    if (err.message?.includes('API')) {
      return res.status(503).json({ success: false, message: 'AI API error. Please try again.' });
    }
    res.status(500).json({ success: false, message: 'Listing optimization failed.' });
  }
});

// ---- History ----
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [rows] = await sequelize.query(
      'SELECT * FROM listing_optimizations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      { replacements: [req.user.id, limit] }
    );
    res.json({ success: true, optimizations: rows });
  } catch (err) {
    console.error('Listing history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
});

// ---- Delete ----
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [, meta] = await sequelize.query(
      'DELETE FROM listing_optimizations WHERE id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id] }
    );
    const affectedRows = meta?.affectedRows ?? meta ?? 0;
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Optimization not found.' });
    }
    res.json({ success: true, message: 'Optimization deleted.' });
  } catch (err) {
    console.error('Listing delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete optimization.' });
  }
});

module.exports = router;
