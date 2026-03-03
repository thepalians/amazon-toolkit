const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Webhook, WebhookLog } = require('../models/Webhook');
const webhookService = require('../services/webhookService');
const { v4: uuidv4 } = require('uuid');

const AVAILABLE_EVENTS = [
  'price_alert.triggered', 'competitor.price_change',
  'inventory.low_stock', 'inventory.out_of_stock',
  'abtest.completed', 'campaign.budget_alert',
];

// GET /api/webhooks/list
router.get('/list', auth, async (req, res) => {
  try {
    const webhooks = await Webhook.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, webhooks, availableEvents: AVAILABLE_EVENTS });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch webhooks.' });
  }
});

// POST /api/webhooks/create
router.post('/create', auth, async (req, res) => {
  try {
    const { webhook_name, webhook_url, platform, events } = req.body;
    if (!webhook_name || !webhook_url) return res.status(400).json({ success: false, message: 'Name and URL required.' });

    const webhook = await Webhook.create({
      user_id: req.user.id, webhook_name, webhook_url,
      platform: platform || 'custom',
      events: JSON.stringify(events || []),
      secret_key: uuidv4(),
    });

    res.json({ success: true, webhook });
  } catch (err) {
    console.error('Webhook create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create webhook.' });
  }
});

// POST /api/webhooks/test/:id
router.post('/test/:id', auth, async (req, res) => {
  try {
    const webhook = await Webhook.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found.' });

    const testData = {
      message: 'This is a test notification from Amazon Seller Toolkit',
      asin: 'B0TEST1234',
      price: '$29.99',
      event: 'test.ping',
    };

    const payload = webhookService.formatPayload(webhook.platform, 'test.ping', testData);
    const axios = require('axios');

    const response = await axios.post(webhook.webhook_url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    await WebhookLog.create({
      webhook_id: webhook.id, event_type: 'test.ping',
      payload: JSON.stringify(payload), response_status: response.status,
      response_body: JSON.stringify(response.data).substring(0, 500),
      success: true,
    });

    res.json({ success: true, message: 'Test sent successfully', status: response.status });
  } catch (err) {
    res.json({ success: false, message: `Test failed: ${err.message}` });
  }
});

// PUT /api/webhooks/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const webhook = await Webhook.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!webhook) return res.status(404).json({ success: false, message: 'Not found.' });
    if (req.body.events) req.body.events = JSON.stringify(req.body.events);
    await webhook.update(req.body);
    res.json({ success: true, webhook });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// DELETE /api/webhooks/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await WebhookLog.destroy({ where: { webhook_id: req.params.id } });
    await Webhook.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Webhook deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

// GET /api/webhooks/logs/:id
router.get('/logs/:id', auth, async (req, res) => {
  try {
    const logs = await WebhookLog.findAll({
      where: { webhook_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
});

module.exports = router;
