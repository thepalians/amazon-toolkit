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

module.exports = router;
