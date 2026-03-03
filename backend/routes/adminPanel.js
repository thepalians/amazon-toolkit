const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User } = require('../models/User');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Admin check middleware
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Access denied.' });
  }
};

// GET /api/admin-panel/stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const newToday = await User.count({ where: { created_at: { [Op.gte]: today } } });

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = await User.count({ where: { created_at: { [Op.gte]: weekAgo } } });

    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const newThisMonth = await User.count({ where: { created_at: { [Op.gte]: monthAgo } } });

    // Tables stats
    const tableQueries = [
      'chat_sessions', 'ppc_campaigns', 'competitor_tracking', 'inventory_items',
      'ab_tests', 'suppliers', 'rank_trackers', 'webhooks', 'price_alerts',
    ];

    const tableCounts = {};
    for (const table of tableQueries) {
      try {
        const [rows] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = rows[0].count;
      } catch { tableCounts[table] = 0; }
    }

    // Recent signups
    const recentUsers = await User.findAll({
      order: [['created_at', 'DESC']],
      limit: 20,
      attributes: ['id', 'full_name', 'email', 'created_at'],
    });

    // User growth (last 7 days)
    const growth = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = await User.count({ where: { created_at: { [Op.gte]: d, [Op.lt]: next } } });
      growth.push({ date: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), users: count });
    }

    res.json({
      success: true,
      stats: {
        totalUsers, newToday, newThisWeek, newThisMonth,
        tableCounts, growth,
      },
      recentUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/admin-panel/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: users, count: total } = await User.findAndCountAll({
      where, order: [['created_at', 'DESC']],
      limit: parseInt(limit), offset,
      attributes: ['id', 'full_name', 'email', 'role', 'created_at', 'updated_at'],
    });

    res.json({ success: true, users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PUT /api/admin-panel/users/:id/role
router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    await User.update({ role }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Role updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// GET /api/admin-panel/system
router.get('/system', auth, adminOnly, async (req, res) => {
  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    const [tables] = await sequelize.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()");
    const [dbSize] = await sequelize.query("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb FROM information_schema.tables WHERE table_schema = DATABASE()");

    res.json({
      success: true,
      system: {
        nodeVersion: process.version,
        uptime: Math.round(uptime / 3600) + ' hours',
        memoryMB: Math.round(memory.rss / 1024 / 1024),
        heapMB: Math.round(memory.heapUsed / 1024 / 1024),
        tables: tables[0].count,
        dbSizeMB: dbSize[0].size_mb || 0,
        platform: process.platform,
        env: process.env.NODE_ENV,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'System info failed.' });
  }
});

module.exports = router;
