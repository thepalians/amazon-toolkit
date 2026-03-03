/**
 * ADMIN ROUTES  /api/admin/...
 *
 * POST   /api/admin/login           (public)
 * GET    /api/admin/dashboard       (protected)
 * GET    /api/admin/users           (protected)
 * PUT    /api/admin/users/:id       (protected)
 * DELETE /api/admin/users/:id       (protected)
 * PUT    /api/admin/users/:id/status (protected)
 * GET    /api/admin/api-keys        (protected)
 * PUT    /api/admin/api-keys        (protected)
 * GET    /api/admin/settings        (protected)
 * PUT    /api/admin/settings        (protected)
 * GET    /api/admin/logs            (protected)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const router = express.Router();

const AdminUser = require('../models/AdminUser');
const ApiKey = require('../models/ApiKey');
const SystemSetting = require('../models/SystemSetting');
const ApiLog = require('../models/ApiLog');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const DEFAULT_API_CALLS = 100;

// ──────────────────────────────────────────────────────────────
// POST /api/admin/login  (public)
// ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await AdminUser.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ──────────────────────────────────────────────────────────────
// All routes below require admin JWT
// ──────────────────────────────────────────────────────────────
router.use(adminAuth);

// ──────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
// ──────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apiCallsToday = await ApiLog.count({
      where: { created_at: { [Op.gte]: today } },
    });

    const recentUsers = await User.findAll({
      attributes: ['id', 'email', 'full_name', 'country_code', 'subscription_plan', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        apiCallsToday,
        systemStatus: 'ok',
      },
      recentUsers,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/users?page=1&limit=20&search=foo
// ──────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = search
      ? {
          [Op.or]: [
            { email: { [Op.like]: `%${search}%` } },
            { full_name: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'email', 'full_name', 'country_code', 'subscription_plan', 'api_calls_remaining', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      total: count,
      page,
      limit,
      users: rows,
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id
// ──────────────────────────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const allowed = ['full_name', 'email', 'subscription_plan', 'api_calls_remaining'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await user.update(updates);
    res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ──────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/status  { is_active: true/false }
// We store status via subscription_plan: disabled users get plan 'free'
// and a separate is_active flag stored in subscription_plan prefix.
// Since the User model doesn't have is_active yet, we add a workaround:
// set api_calls_remaining to -1 to signal disabled.
// ──────────────────────────────────────────────────────────────
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { is_active } = req.body;
    // Use api_calls_remaining = -1 to flag disabled
    await user.update({ api_calls_remaining: is_active ? Math.max(0, user.api_calls_remaining === -1 ? DEFAULT_API_CALLS : user.api_calls_remaining) : -1 });
    res.json({ success: true, message: `User ${is_active ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error('Admin status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/api-keys
// ──────────────────────────────────────────────────────────────
router.get('/api-keys', async (req, res) => {
  try {
    const keys = await ApiKey.findAll({ order: [['service_name', 'ASC']] });
    // Mask keys — show only last 4 chars (safe for keys shorter than 4 chars too)
    const masked = keys.map((k) => ({
      id: k.id,
      service_name: k.service_name,
      api_key: k.api_key ? `****${k.api_key.length > 4 ? k.api_key.slice(-4) : '****'}` : '',
      api_secret: k.api_secret ? `****${k.api_secret.length > 4 ? k.api_secret.slice(-4) : '****'}` : '',
      is_active: k.is_active,
      created_at: k.created_at,
      updated_at: k.updated_at,
    }));
    res.json({ success: true, api_keys: masked });
  } catch (err) {
    console.error('Admin api-keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to load API keys.' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/api-keys  { service_name, api_key, api_secret, is_active }
// ──────────────────────────────────────────────────────────────
router.put('/api-keys', async (req, res) => {
  try {
    const { service_name, api_key, api_secret, is_active } = req.body;
    if (!service_name) {
      return res.status(400).json({ success: false, message: 'service_name is required.' });
    }

    const [record] = await ApiKey.findOrCreate({
      where: { service_name },
      defaults: { api_key: '', api_secret: '', is_active: true },
    });

    const updates = {};
    if (api_key !== undefined) updates.api_key = api_key;
    if (api_secret !== undefined) updates.api_secret = api_secret;
    if (is_active !== undefined) updates.is_active = is_active;

    await record.update(updates);
    res.json({ success: true, message: 'API key updated.' });
  } catch (err) {
    console.error('Admin update api-key error:', err);
    res.status(500).json({ success: false, message: 'Failed to update API key.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/settings
// ──────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const rows = await SystemSetting.findAll();
    const settings = {};
    for (const r of rows) settings[r.setting_key] = r.setting_value;
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to load settings.' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/settings  { key: value, ... }
// ──────────────────────────────────────────────────────────────
router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.upsert({ setting_key: key, setting_value: String(value) });
    }
    res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    console.error('Admin update settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/logs?limit=50
// ──────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const logs = await ApiLog.findAll({
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({ success: true, logs });
  } catch (err) {
    console.error('Admin logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to load logs.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/plans
// ──────────────────────────────────────────────────────────────
const SubscriptionPlan = require('../models/SubscriptionPlan');
const LicenseKey = require('../models/LicenseKey');
const Payment = require('../models/Payment');
const UserSubscription = require('../models/UserSubscription');
const ActivationKey = require('../models/ActivationKey');

router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ success: true, plans });
  } catch (err) {
    console.error('Admin plans error:', err);
    res.status(500).json({ success: false, message: 'Failed to load plans.' });
  }
});

// PUT /api/admin/plans/:id
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    const allowed = ['display_name', 'price_monthly', 'price_yearly', 'features', 'limits', 'is_active', 'sort_order'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await plan.update(updates);
    res.json({ success: true, message: 'Plan updated.' });
  } catch (err) {
    console.error('Admin update plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to update plan.' });
  }
});

// GET /api/admin/license-keys
router.get('/license-keys', async (req, res) => {
  try {
    const { status, plan } = req.query;
    const where = {};
    if (status) where.status = status;
    if (plan) where.plan_name = plan;
    const keys = await LicenseKey.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    res.json({ success: true, keys });
  } catch (err) {
    console.error('Admin license keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to load license keys.' });
  }
});

// POST /api/admin/license-keys/generate  { plan_name, duration, quantity, notes }
router.post('/license-keys/generate', async (req, res) => {
  try {
    const { plan_name, duration, quantity = 1, notes } = req.body;
    if (!plan_name || !duration) {
      return res.status(400).json({ success: false, message: 'plan_name and duration are required.' });
    }
    const count = Math.min(100, Math.max(1, parseInt(quantity) || 1));
    const generated = [];

    for (let i = 0; i < count; i++) {
      let key;
      let exists = true;
      while (exists) {
        const part = () => crypto.randomBytes(3).toString('hex').toUpperCase();
        key = `AST-${part()}-${part()}-${part()}-${part()}`;
        exists = await LicenseKey.findOne({ where: { license_key: key } });
      }
      const rec = await LicenseKey.create({
        license_key: key,
        plan_name,
        duration,
        status: 'unused',
        created_by: req.admin.id,
        notes: notes || null,
      });
      generated.push(rec);
    }

    res.json({ success: true, message: `Generated ${count} license key(s).`, keys: generated });
  } catch (err) {
    console.error('Admin generate keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate license keys.' });
  }
});

// PUT /api/admin/license-keys/:id/revoke
router.put('/license-keys/:id/revoke', async (req, res) => {
  try {
    const key = await LicenseKey.findByPk(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'License key not found.' });
    await key.update({ status: 'revoked' });
    res.json({ success: true, message: 'License key revoked.' });
  } catch (err) {
    console.error('Admin revoke key error:', err);
    res.status(500).json({ success: false, message: 'Failed to revoke license key.' });
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
  try {
    const { status, gateway } = req.query;
    const where = {};
    if (status) where.status = status;
    if (gateway) where.payment_gateway = gateway;
    const payments = await Payment.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    res.json({ success: true, payments });
  } catch (err) {
    console.error('Admin payments error:', err);
    res.status(500).json({ success: false, message: 'Failed to load payments.' });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const subs = await UserSubscription.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    console.error('Admin subscriptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load subscriptions.' });
  }
});

// PUT /api/admin/subscriptions/:id
router.put('/subscriptions/:id', async (req, res) => {
  try {
    const sub = await UserSubscription.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
    const allowed = ['plan_name', 'status', 'expires_at', 'auto_renew'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await sub.update(updates);
    // Sync user subscription_plan if plan changed
    if (updates.plan_name) {
      const validPlans = ['free', 'basic', 'premium', 'pro', 'enterprise'];
      const plan = validPlans.includes(updates.plan_name) ? updates.plan_name : 'basic';
      await User.update({ subscription_plan: plan }, { where: { id: sub.user_id } });
    }
    res.json({ success: true, message: 'Subscription updated.' });
  } catch (err) {
    console.error('Admin update subscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to update subscription.' });
  }
});

// GET /api/admin/revenue
router.get('/revenue', async (req, res) => {
  try {
    const { sequelize: seq } = require('../config/database');
    const monthly = await seq.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             SUM(amount) as total,
             COUNT(*) as count,
             payment_gateway
      FROM payments
      WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month, payment_gateway
      ORDER BY month DESC
    `, { type: seq.QueryTypes.SELECT });

    const byPlan = await seq.query(`
      SELECT plan_name, SUM(amount) as total, COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
      GROUP BY plan_name
    `, { type: seq.QueryTypes.SELECT });

    res.json({ success: true, monthly, byPlan });
  } catch (err) {
    console.error('Admin revenue error:', err);
    res.status(500).json({ success: false, message: 'Failed to load revenue data.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/keys?batch_id=&plan_type=&is_used=&page=1&limit=50
// ──────────────────────────────────────────────────────────────
router.get('/keys', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.batch_id) where.batch_id = req.query.batch_id;
    if (req.query.plan_type) where.plan_type = req.query.plan_type;
    if (req.query.is_used !== undefined && req.query.is_used !== '') {
      where.is_used = parseInt(req.query.is_used);
    }

    const { count, rows } = await ActivationKey.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Attach used_by user details
    const userIds = rows.filter((k) => k.used_by).map((k) => k.used_by);
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'full_name', 'email'],
      });
      for (const u of users) usersMap[u.id] = u;
    }

    const keys = rows.map((k) => ({
      ...k.toJSON(),
      user: k.used_by ? usersMap[k.used_by] || null : null,
    }));

    res.json({ success: true, total: count, page, limit, keys });
  } catch (err) {
    console.error('Admin list keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to load activation keys.' });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/admin/keys/generate
// Body: { planType, durationMonths, quantity, batchId }
// ──────────────────────────────────────────────────────────────
router.post('/keys/generate', async (req, res) => {
  try {
    const { planType, durationMonths, quantity = 1, batchId } = req.body;
    if (!planType || !durationMonths || !batchId) {
      return res.status(400).json({ success: false, message: 'planType, durationMonths, and batchId are required.' });
    }
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ success: false, message: `Invalid planType. Must be one of: ${validPlans.join(', ')}.` });
    }
    const count = Math.min(500, Math.max(1, parseInt(quantity) || 1));
    const months = Math.max(1, parseInt(durationMonths) || 12);
    const generated = [];

    for (let i = 0; i < count; i++) {
      let keyCode;
      let exists = true;
      while (exists) {
        const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
        keyCode = `AST-${part()}-${part()}-${part()}`;
        exists = await ActivationKey.findOne({ where: { key_code: keyCode } });
      }
      const key = await ActivationKey.create({
        key_code: keyCode,
        plan_type: planType,
        duration_months: months,
        batch_id: batchId,
      });
      generated.push(key);
    }

    res.json({ success: true, message: `Generated ${generated.length} activation key(s).`, keys: generated });
  } catch (err) {
    console.error('Admin generate activation keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate activation keys.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/keys/export/:batchId — CSV export of unused keys
// ──────────────────────────────────────────────────────────────
router.get('/keys/export/:batchId', async (req, res) => {
  try {
    const keys = await ActivationKey.findAll({
      where: { batch_id: req.params.batchId, is_used: 0 },
      order: [['created_at', 'ASC']],
    });

    const csvLines = ['key_code,plan_type,duration_months,batch_id'];
    for (const k of keys) {
      csvLines.push(`${k.key_code},${k.plan_type},${k.duration_months},${k.batch_id}`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="keys-${req.params.batchId}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (err) {
    console.error('Admin export keys error:', err);
    res.status(500).json({ success: false, message: 'Failed to export keys.' });
  }
});

module.exports = router;
