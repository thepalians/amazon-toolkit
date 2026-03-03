const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CompetitorTracking, CompetitorPriceHistory } = require('../models/Competitor');
const { PriceAlert, AlertNotification } = require('../models/PriceAlert');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * =============================================
 * DASHBOARD ANALYTICS API
 * =============================================
 * Aggregated stats, trends, charts data
 * =============================================
 */

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Tracked ASINs
    const trackedAsins = await CompetitorTracking.count({
      where: { user_id: userId, is_active: true },
    });

    // Total price checks (history records for user's trackings)
    const trackingIds = await CompetitorTracking.findAll({
      where: { user_id: userId },
      attributes: ['id'],
      raw: true,
    });
    const tIds = trackingIds.map(t => t.id);

    const totalPriceChecks = tIds.length > 0 ? await CompetitorPriceHistory.count({
      where: { tracking_id: tIds },
    }) : 0;

    // Active alerts
    const activeAlerts = await PriceAlert.count({
      where: { user_id: userId, is_active: true },
    });

    // Triggered alerts
    const triggeredAlerts = await PriceAlert.count({
      where: { user_id: userId, is_triggered: true },
    });

    // Unread notifications
    const unreadNotifications = await AlertNotification.count({
      where: { user_id: userId, is_read: false },
    });

    // Total notifications
    const totalNotifications = await AlertNotification.count({
      where: { user_id: userId },
    });

    res.json({
      success: true,
      stats: {
        trackedAsins,
        totalPriceChecks,
        activeAlerts,
        triggeredAlerts,
        unreadNotifications,
        totalNotifications,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/dashboard/price-trends — 7-day price trend for tracked ASINs
router.get('/price-trends', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackings = await CompetitorTracking.findAll({
      where: { user_id: userId, is_active: true },
      attributes: ['id', 'asin', 'product_title'],
      limit: 5,
      order: [['created_at', 'DESC']],
    });

    const trends = [];
    for (const tracking of trackings) {
      const history = await CompetitorPriceHistory.findAll({
        where: { tracking_id: tracking.id },
        attributes: ['price', 'currency', 'recorded_at'],
        order: [['recorded_at', 'DESC']],
        limit: 30,
      });

      if (history.length > 0) {
        trends.push({
          asin: tracking.asin,
          title: tracking.product_title || tracking.asin,
          data: history.reverse().map(h => ({
            date: h.recorded_at,
            price: parseFloat(h.price),
            currency: h.currency,
          })),
        });
      }
    }

    res.json({ success: true, trends });
  } catch (err) {
    console.error('Price trends error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trends.' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Recent notifications
    const notifications = await AlertNotification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Recent price checks
    const trackings = await CompetitorTracking.findAll({
      where: { user_id: userId },
      attributes: ['id', 'asin', 'product_title'],
      raw: true,
    });
    const tIds = trackings.map(t => t.id);
    const tMap = {};
    trackings.forEach(t => { tMap[t.id] = t; });

    const recentChecks = tIds.length > 0 ? await CompetitorPriceHistory.findAll({
      where: { tracking_id: tIds },
      order: [['recorded_at', 'DESC']],
      limit: 10,
    }) : [];

    const activity = [
      ...notifications.map(n => ({
        type: 'notification',
        icon: '🔔',
        title: n.title,
        message: n.message,
        date: n.createdAt,
      })),
      ...recentChecks.map(c => ({
        type: 'price_check',
        icon: '💰',
        title: `Price Check: ${tMap[c.tracking_id]?.asin || 'Unknown'}`,
        message: `${c.currency}${c.price} — ${c.stock_status || 'In Stock'}`,
        date: c.recorded_at,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

    res.json({ success: true, activity });
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activity.' });
  }
});

module.exports = router;
