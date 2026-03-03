const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { RankTracker, RankHistory } = require('../models/RankTracker');
const axios = require('axios');
const cheerio = require('cheerio');

async function checkRank(asin, keyword, countryCode) {
  const marketplaces = {
    US: 'https://www.amazon.com', IN: 'https://www.amazon.in', UK: 'https://www.amazon.co.uk',
    AE: 'https://www.amazon.ae', DE: 'https://www.amazon.de', FR: 'https://www.amazon.fr',
    CA: 'https://www.amazon.ca', AU: 'https://www.amazon.com.au', JP: 'https://www.amazon.co.jp',
  };
  const base = marketplaces[countryCode] || marketplaces.US;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  for (let page = 1; page <= 5; page++) {
    try {
      const url = `${base}/s?k=${encodeURIComponent(keyword)}&page=${page}`;
      const res = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(res.data);

      let position = 0;
      let found = false;

      $('[data-asin]').each((i, el) => {
        const dataAsin = $(el).attr('data-asin');
        if (dataAsin && dataAsin.length === 10) {
          position++;
          if (dataAsin.toUpperCase() === asin.toUpperCase()) {
            found = true;
            return false;
          }
        }
      });

      if (found) {
        const overallPosition = ((page - 1) * 48) + position;
        return { rank: overallPosition, page };
      }

      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Rank check page ${page} error:`, err.message);
    }
  }

  return { rank: 0, page: 0 };
}

// GET /api/rank-tracker/list
router.get('/list', auth, async (req, res) => {
  try {
    const trackers = await RankTracker.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['created_at', 'DESC']],
    });

    const summary = {
      total: trackers.length,
      page1: trackers.filter(t => t.current_rank > 0 && t.current_rank <= 48).length,
      improved: trackers.filter(t => t.previous_rank > 0 && t.current_rank < t.previous_rank).length,
      dropped: trackers.filter(t => t.previous_rank > 0 && t.current_rank > t.previous_rank).length,
    };

    res.json({ success: true, trackers, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch trackers.' });
  }
});

// POST /api/rank-tracker/add
router.post('/add', auth, async (req, res) => {
  try {
    const { asin, keyword, country_code } = req.body;
    if (!asin || !keyword) return res.status(400).json({ success: false, message: 'ASIN and keyword required.' });

    const tracker = await RankTracker.create({
      user_id: req.user.id, asin: asin.toUpperCase(),
      keyword, country_code: country_code || 'US',
    });
    res.json({ success: true, tracker });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add tracker.' });
  }
});

// POST /api/rank-tracker/check/:id
router.post('/check/:id', auth, async (req, res) => {
  try {
    const tracker = await RankTracker.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tracker) return res.status(404).json({ success: false, message: 'Tracker not found.' });

    const { rank, page } = await checkRank(tracker.asin, tracker.keyword, tracker.country_code);

    const updates = {
      previous_rank: tracker.current_rank,
      current_rank: rank,
      last_checked: new Date(),
    };

    if (rank > 0) {
      if (tracker.best_rank === 0 || rank < tracker.best_rank) updates.best_rank = rank;
      if (rank > tracker.worst_rank) updates.worst_rank = rank;
    }

    await tracker.update(updates);

    await RankHistory.create({
      tracker_id: tracker.id, rank_position: rank, page,
    });

    res.json({ success: true, tracker: { ...tracker.toJSON(), ...updates }, rank, page });
  } catch (err) {
    console.error('Rank check error:', err);
    res.status(500).json({ success: false, message: 'Rank check failed.' });
  }
});

// GET /api/rank-tracker/history/:id
router.get('/history/:id', auth, async (req, res) => {
  try {
    const history = await RankHistory.findAll({
      where: { tracker_id: req.params.id },
      order: [['checked_at', 'DESC']],
      limit: 30,
    });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// DELETE /api/rank-tracker/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await RankTracker.update({ is_active: false }, { where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Tracker removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;
