const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Supplier } = require('../models/Supplier');
const { Op } = require('sequelize');

// GET /api/suppliers/list
router.get('/list', auth, async (req, res) => {
  try {
    const { search, country, platform, sort } = req.query;
    const where = { user_id: req.user.id, is_active: true };

    if (search) {
      where[Op.or] = [
        { supplier_name: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } },
        { product_categories: { [Op.like]: `%${search}%` } },
      ];
    }
    if (country) where.country = country;
    if (platform) where.platform = platform;

    let order = [['created_at', 'DESC']];
    if (sort === 'rating') order = [['rating', 'DESC']];
    if (sort === 'name') order = [['supplier_name', 'ASC']];
    if (sort === 'lead_time') order = [['avg_lead_time_days', 'ASC']];

    const suppliers = await Supplier.findAll({ where, order });

    // Stats
    const total = suppliers.length;
    const byCountry = {};
    const byPlatform = {};
    suppliers.forEach(s => {
      byCountry[s.country || 'Unknown'] = (byCountry[s.country || 'Unknown'] || 0) + 1;
      byPlatform[s.platform || 'manual'] = (byPlatform[s.platform || 'manual'] || 0) + 1;
    });

    res.json({ success: true, suppliers, stats: { total, byCountry, byPlatform } });
  } catch (err) {
    console.error('Supplier list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers.' });
  }
});

// POST /api/suppliers/add
router.post('/add', auth, async (req, res) => {
  try {
    const { supplier_name, contact_person, email, phone, website, country, city,
      platform, product_categories, min_order_qty, avg_lead_time_days,
      payment_terms, rating, notes } = req.body;

    if (!supplier_name) return res.status(400).json({ success: false, message: 'Supplier name is required.' });

    const supplier = await Supplier.create({
      user_id: req.user.id,
      supplier_name, contact_person, email, phone, website, country, city,
      platform: platform || 'manual',
      product_categories, min_order_qty: parseInt(min_order_qty) || 0,
      avg_lead_time_days: parseInt(avg_lead_time_days) || 14,
      payment_terms, rating: parseInt(rating) || 0, notes,
    });

    res.json({ success: true, supplier });
  } catch (err) {
    console.error('Supplier add error:', err);
    res.status(500).json({ success: false, message: 'Failed to add supplier.' });
  }
});

// PUT /api/suppliers/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });

    await supplier.update(req.body);
    res.json({ success: true, supplier });
  } catch (err) {
    console.error('Supplier update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update supplier.' });
  }
});

// DELETE /api/suppliers/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });

    await supplier.update({ is_active: false });
    res.json({ success: true, message: 'Supplier removed.' });
  } catch (err) {
    console.error('Supplier delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete supplier.' });
  }
});

module.exports = router;
