const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { ABTest } = require('../models/ABTest');

// Statistical significance calc (simplified Z-test)
function calcConfidence(aViews, aConv, bViews, bConv) {
  if (aViews < 30 || bViews < 30) return 0;
  const pA = aConv / aViews;
  const pB = bConv / bViews;
  const pPool = (aConv + bConv) / (aViews + bViews);
  const se = Math.sqrt(pPool * (1 - pPool) * (1/aViews + 1/bViews));
  if (se === 0) return 0;
  const z = Math.abs(pA - pB) / se;
  // Approximate confidence from Z-score
  if (z >= 2.576) return 99;
  if (z >= 1.96) return 95;
  if (z >= 1.645) return 90;
  if (z >= 1.28) return 80;
  return Math.min(Math.round(z * 40), 79);
}

// GET /api/abtest/list
router.get('/list', auth, async (req, res) => {
  try {
    const tests = await ABTest.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    const testsWithStats = tests.map(t => {
      const d = t.toJSON();
      const aCTR = d.variant_a_views > 0 ? Math.round((d.variant_a_clicks / d.variant_a_views) * 10000) / 100 : 0;
      const bCTR = d.variant_b_views > 0 ? Math.round((d.variant_b_clicks / d.variant_b_views) * 10000) / 100 : 0;
      const aConvRate = d.variant_a_clicks > 0 ? Math.round((d.variant_a_sales / d.variant_a_clicks) * 10000) / 100 : 0;
      const bConvRate = d.variant_b_clicks > 0 ? Math.round((d.variant_b_sales / d.variant_b_clicks) * 10000) / 100 : 0;
      return { ...d, stats: { aCTR, bCTR, aConvRate, bConvRate } };
    });

    res.json({ success: true, tests: testsWithStats });
  } catch (err) {
    console.error('AB list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tests.' });
  }
});

// POST /api/abtest/create
router.post('/create', auth, async (req, res) => {
  try {
    const test = await ABTest.create({ ...req.body, user_id: req.user.id });
    res.json({ success: true, test });
  } catch (err) {
    console.error('AB create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create test.' });
  }
});

// PUT /api/abtest/update/:id — update metrics
router.put('/update/:id', auth, async (req, res) => {
  try {
    const test = await ABTest.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found.' });

    await test.update(req.body);

    // Recalculate confidence + winner
    const confidence = calcConfidence(
      test.variant_a_views, test.variant_a_sales,
      test.variant_b_views, test.variant_b_sales
    );

    let winner = 'none';
    if (confidence >= 90) {
      const aRate = test.variant_a_views > 0 ? test.variant_a_sales / test.variant_a_views : 0;
      const bRate = test.variant_b_views > 0 ? test.variant_b_sales / test.variant_b_views : 0;
      winner = aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'none';
    }

    await test.update({ confidence, winner });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// DELETE /api/abtest/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await ABTest.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Test deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;
