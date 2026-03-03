const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { InventoryItem, InventoryLog } = require('../models/Inventory');
const { Op } = require('sequelize');

/**
 * =============================================
 * INVENTORY FORECASTING API
 * =============================================
 * Stock management + demand forecasting
 * =============================================
 */

// Calculate forecast for a single item
function calculateForecast(item) {
  const dailySales = item.daily_sales || 0;
  const currentStock = item.current_stock || 0;
  const leadTime = item.lead_time_days || 14;
  const safetyDays = item.safety_stock_days || 7;

  // Days of stock remaining
  const daysRemaining = dailySales > 0 ? Math.floor(currentStock / dailySales) : 999;

  // Stockout date
  const stockoutDate = new Date();
  stockoutDate.setDate(stockoutDate.getDate() + daysRemaining);

  // Reorder point = (daily sales × lead time) + safety stock
  const safetyStock = Math.ceil(dailySales * safetyDays);
  const reorderPoint = Math.ceil(dailySales * leadTime) + safetyStock;

  // Should reorder?
  const needsReorder = currentStock <= reorderPoint;

  // Suggested reorder quantity (30 days of sales + safety stock - current)
  const suggestedReorder = Math.max(
    Math.ceil(dailySales * 30) + safetyStock - currentStock,
    item.reorder_quantity || 0
  );

  // Status
  let status = 'healthy';
  let statusColor = '#22c55e';
  let statusIcon = '✅';
  if (currentStock <= 0) { status = 'out_of_stock'; statusColor = '#ef4444'; statusIcon = '🔴'; }
  else if (needsReorder) { status = 'reorder_now'; statusColor = '#f97316'; statusIcon = '⚠️'; }
  else if (daysRemaining <= leadTime + safetyDays + 7) { status = 'low_stock'; statusColor = '#f59e0b'; statusIcon = '🟡'; }

  // Revenue forecast
  const monthlyRevenue = Math.round(dailySales * 30 * (item.selling_price || 0));
  const monthlyCost = Math.round(dailySales * 30 * (item.cost_per_unit || 0));
  const monthlyProfit = monthlyRevenue - monthlyCost;

  // 30/60/90 day forecast
  const forecast30 = Math.round(dailySales * 30);
  const forecast60 = Math.round(dailySales * 60);
  const forecast90 = Math.round(dailySales * 90);

  return {
    daysRemaining: Math.min(daysRemaining, 999),
    stockoutDate: daysRemaining < 999 ? stockoutDate.toISOString().split('T')[0] : null,
    reorderPoint,
    safetyStock,
    needsReorder,
    suggestedReorder: Math.max(suggestedReorder, 0),
    status, statusColor, statusIcon,
    monthlyRevenue, monthlyCost, monthlyProfit,
    forecast: { days30: forecast30, days60: forecast60, days90: forecast90 },
  };
}

// GET /api/inventory/list
router.get('/list', auth, async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['created_at', 'DESC']],
    });

    const itemsWithForecast = items.map(item => ({
      ...item.toJSON(),
      forecast: calculateForecast(item),
    }));

    // Summary stats
    const totalItems = itemsWithForecast.length;
    const outOfStock = itemsWithForecast.filter(i => i.forecast.status === 'out_of_stock').length;
    const needsReorder = itemsWithForecast.filter(i => i.forecast.needsReorder).length;
    const lowStock = itemsWithForecast.filter(i => i.forecast.status === 'low_stock').length;
    const healthy = totalItems - outOfStock - needsReorder - lowStock;
    const totalValue = itemsWithForecast.reduce((sum, i) => sum + (i.current_stock * (i.cost_per_unit || 0)), 0);
    const totalMonthlyRevenue = itemsWithForecast.reduce((sum, i) => sum + i.forecast.monthlyRevenue, 0);

    res.json({
      success: true,
      items: itemsWithForecast,
      summary: { totalItems, outOfStock, needsReorder, lowStock, healthy, totalValue: Math.round(totalValue), totalMonthlyRevenue },
    });
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
});

// POST /api/inventory/add
router.post('/add', auth, async (req, res) => {
  try {
    const { asin, sku, product_title, country_code, current_stock, daily_sales,
      lead_time_days, safety_stock_days, reorder_quantity, cost_per_unit, selling_price,
      supplier_name, notes } = req.body;

    if (!asin) return res.status(400).json({ success: false, message: 'ASIN is required.' });

    const item = await InventoryItem.create({
      user_id: req.user.id,
      asin: asin.toUpperCase(),
      sku, product_title, country_code: country_code || 'US',
      current_stock: parseInt(current_stock) || 0,
      daily_sales: parseFloat(daily_sales) || 0,
      lead_time_days: parseInt(lead_time_days) || 14,
      safety_stock_days: parseInt(safety_stock_days) || 7,
      reorder_quantity: parseInt(reorder_quantity) || 100,
      cost_per_unit: parseFloat(cost_per_unit) || 0,
      selling_price: parseFloat(selling_price) || 0,
      supplier_name, notes,
    });

    await InventoryLog.create({
      inventory_id: item.id, user_id: req.user.id,
      action: 'restock', quantity_change: item.current_stock,
      stock_before: 0, stock_after: item.current_stock,
      note: 'Initial stock added',
    });

    res.json({ success: true, item: { ...item.toJSON(), forecast: calculateForecast(item) } });
  } catch (err) {
    console.error('Inventory add error:', err);
    res.status(500).json({ success: false, message: 'Failed to add item.' });
  }
});

// PUT /api/inventory/update/:id
router.put('/update/:id', auth, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    const oldStock = item.current_stock;
    await item.update(req.body);

    if (req.body.current_stock !== undefined && req.body.current_stock !== oldStock) {
      await InventoryLog.create({
        inventory_id: item.id, user_id: req.user.id,
        action: 'adjustment',
        quantity_change: item.current_stock - oldStock,
        stock_before: oldStock, stock_after: item.current_stock,
        note: req.body.note || 'Stock updated',
      });
    }

    res.json({ success: true, item: { ...item.toJSON(), forecast: calculateForecast(item) } });
  } catch (err) {
    console.error('Inventory update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update item.' });
  }
});

// POST /api/inventory/restock/:id
router.post('/restock/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Quantity must be > 0.' });

    const item = await InventoryItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    const oldStock = item.current_stock;
    await item.update({
      current_stock: oldStock + parseInt(quantity),
      last_restock_date: new Date(),
    });

    await InventoryLog.create({
      inventory_id: item.id, user_id: req.user.id,
      action: 'restock', quantity_change: parseInt(quantity),
      stock_before: oldStock, stock_after: item.current_stock,
      note: `Restocked +${quantity} units`,
    });

    res.json({ success: true, item: { ...item.toJSON(), forecast: calculateForecast(item) } });
  } catch (err) {
    console.error('Restock error:', err);
    res.status(500).json({ success: false, message: 'Restock failed.' });
  }
});

// DELETE /api/inventory/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    await item.update({ is_active: false });
    res.json({ success: true, message: 'Item removed.' });
  } catch (err) {
    console.error('Inventory delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
});

// GET /api/inventory/logs/:id
router.get('/logs/:id', auth, async (req, res) => {
  try {
    const logs = await InventoryLog.findAll({
      where: { inventory_id: req.params.id, user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs.' });
  }
});

module.exports = router;
