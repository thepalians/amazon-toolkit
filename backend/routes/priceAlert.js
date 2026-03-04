/**
 * =============================================
 * PRICE ALERT ROUTES
 * =============================================
 * POST   /api/alerts              — Create alert
 * GET    /api/alerts              — List user alerts
 * PUT    /api/alerts/:id          — Update alert
 * DELETE /api/alerts/:id          — Delete alert
 * GET    /api/alerts/notifications — Get notifications
 * PUT    /api/alerts/notifications/read — Mark all as read
 * PUT    /api/alerts/notifications/:id/read — Mark one as read
 * =============================================
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PriceAlert, AlertNotification } = require('../models/PriceAlert');
const { CompetitorTracking } = require('../models/Competitor');
const { Op } = require('sequelize');

// ---- Create Alert ----
router.post('/', auth, async (req, res) => {
  try {
    const { trackingId, alertType, targetPrice, currency, notifyInApp, notifyEmail } = req.body;

    // Verify tracking belongs to user
    const tracking = await CompetitorTracking.findOne({
      where: { id: trackingId, user_id: req.user.id, is_active: true },
    });

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Tracking record not found.' });
    }

    // Validate target price for price-based alerts
    if (['below', 'above'].includes(alertType) && (!targetPrice || targetPrice <= 0)) {
      return res.status(400).json({ success: false, message: 'Target price is required for price alerts.' });
    }

    // Check duplicate
    const existing = await PriceAlert.findOne({
      where: {
        user_id: req.user.id,
        tracking_id: trackingId,
        alert_type: alertType || 'below',
        is_active: true,
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an active alert of this type for this ASIN.' });
    }

    const alert = await PriceAlert.create({
      user_id: req.user.id,
      tracking_id: trackingId,
      asin: tracking.asin,
      alert_type: alertType || 'below',
      target_price: targetPrice || null,
      currency: currency || tracking.country_code === 'IN' ? 'INR' : 'USD',
      notify_in_app: notifyInApp !== false,
      notify_email: notifyEmail === true,
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    console.error('Create alert error:', err);
    res.status(500).json({ success: false, message: 'Failed to create alert.' });
  }
});

// ---- List User Alerts ----
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await PriceAlert.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    // Enrich with tracking info
    const trackingIds = [...new Set(alerts.map(a => a.tracking_id))];
    const trackings = await CompetitorTracking.findAll({
      where: { id: trackingIds },
      attributes: ['id', 'asin', 'product_title', 'country_code', 'marketplace'],
    });
    const trackingMap = {};
    trackings.forEach(t => { trackingMap[t.id] = t; });

    const enriched = alerts.map(a => ({
      ...a.toJSON(),
      tracking: trackingMap[a.tracking_id] || null,
    }));

    res.json({ success: true, alerts: enriched });
  } catch (err) {
    console.error('List alerts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
});

// ---- Update Alert ----
router.put('/:id', auth, async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    const { targetPrice, alertType, isActive, notifyInApp, notifyEmail } = req.body;

    if (targetPrice !== undefined) alert.target_price = targetPrice;
    if (alertType !== undefined) alert.alert_type = alertType;
    if (isActive !== undefined) alert.is_active = isActive;
    if (notifyInApp !== undefined) alert.notify_in_app = notifyInApp;
    if (notifyEmail !== undefined) alert.notify_email = notifyEmail;

    // Reset trigger if re-activated
    if (isActive === true) {
      alert.is_triggered = false;
      alert.triggered_at = null;
      alert.triggered_price = null;
    }

    await alert.save();
    res.json({ success: true, alert });
  } catch (err) {
    console.error('Update alert error:', err);
    res.status(500).json({ success: false, message: 'Failed to update alert.' });
  }
});

// ---- Delete Alert ----
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await PriceAlert.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    console.error('Delete alert error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete alert.' });
  }
});

// ---- Get Notifications ----
router.get('/notifications', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const unreadOnly = req.query.unread === 'true';

    const where = { user_id: req.user.id };
    if (unreadOnly) where.is_read = false;

    const notifications = await AlertNotification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
    });

    const unreadCount = await AlertNotification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// ---- Mark All Notifications Read ----
router.put('/notifications/read', auth, async (req, res) => {
  try {
    await AlertNotification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
});

// ---- Mark Single Notification Read ----
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const updated = await AlertNotification.update(
      { is_read: true },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    if (!updated[0]) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark single read error:', err);
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

module.exports = router;
