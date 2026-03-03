const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { FinancialRecord } = require('../models/Financial');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/financial/records
router.get('/records', auth, async (req, res) => {
  try {
    const { month, year, type } = req.query;
    const where = { user_id: req.user.id };

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      where.record_date = { [Op.gte]: startDate, [Op.lt]: endDate };
    } else if (year) {
      where.record_date = { [Op.gte]: `${year}-01-01`, [Op.lt]: `${parseInt(year)+1}-01-01` };
    }

    if (type) where.record_type = type;

    const records = await FinancialRecord.findAll({ where, order: [['record_date', 'DESC']] });

    // Summary
    const revenue = records.filter(r => r.record_type === 'revenue').reduce((s, r) => s + r.amount, 0);
    const expenses = records.filter(r => ['expense', 'ad_spend', 'fba_fee', 'shipping', 'cogs', 'other'].includes(r.record_type)).reduce((s, r) => s + r.amount, 0);
    const refunds = records.filter(r => r.record_type === 'refund').reduce((s, r) => s + r.amount, 0);
    const adSpend = records.filter(r => r.record_type === 'ad_spend').reduce((s, r) => s + r.amount, 0);
    const fbaFees = records.filter(r => r.record_type === 'fba_fee').reduce((s, r) => s + r.amount, 0);
    const cogs = records.filter(r => r.record_type === 'cogs').reduce((s, r) => s + r.amount, 0);
    const netProfit = revenue - expenses - refunds;
    const profitMargin = revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0;

    // By type breakdown
    const byType = {};
    records.forEach(r => {
      byType[r.record_type] = (byType[r.record_type] || 0) + r.amount;
    });

    res.json({
      success: true, records,
      summary: {
        totalRecords: records.length,
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
        adSpend: Math.round(adSpend * 100) / 100,
        fbaFees: Math.round(fbaFees * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin,
        byType,
      },
    });
  } catch (err) {
    console.error('Financial records error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch records.' });
  }
});

// POST /api/financial/add
router.post('/add', auth, async (req, res) => {
  try {
    const record = await FinancialRecord.create({ ...req.body, user_id: req.user.id });
    res.json({ success: true, record });
  } catch (err) {
    console.error('Financial add error:', err);
    res.status(500).json({ success: false, message: 'Failed to add record.' });
  }
});

// POST /api/financial/bulk — add multiple records
router.post('/bulk', auth, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ success: false, message: 'Records array required.' });
    const created = await FinancialRecord.bulkCreate(records.map(r => ({ ...r, user_id: req.user.id })));
    res.json({ success: true, count: created.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bulk add failed.' });
  }
});

// PUT /api/financial/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const record = await FinancialRecord.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    await record.update(req.body);
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// DELETE /api/financial/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await FinancialRecord.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

// GET /api/financial/monthly-summary — P&L per month
router.get('/monthly-summary', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const yr = year || new Date().getFullYear();
    const where = {
      user_id: req.user.id,
      record_date: { [Op.gte]: `${yr}-01-01`, [Op.lt]: `${parseInt(yr)+1}-01-01` },
    };

    const records = await FinancialRecord.findAll({ where, order: [['record_date', 'ASC']] });

    const months = {};
    for (let m = 1; m <= 12; m++) {
      months[m] = { month: m, revenue: 0, expenses: 0, refunds: 0, netProfit: 0 };
    }

    records.forEach(r => {
      const m = new Date(r.record_date).getMonth() + 1;
      if (r.record_type === 'revenue') months[m].revenue += r.amount;
      else if (r.record_type === 'refund') months[m].refunds += r.amount;
      else months[m].expenses += r.amount;
    });

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySummary = Object.values(months).map(m => ({
      ...m,
      monthName: monthNames[m.month],
      netProfit: Math.round((m.revenue - m.expenses - m.refunds) * 100) / 100,
      revenue: Math.round(m.revenue * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
    }));

    res.json({ success: true, year: yr, monthlySummary });
  } catch (err) {
    console.error('Monthly summary error:', err);
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

module.exports = router;
