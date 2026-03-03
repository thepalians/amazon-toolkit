const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  asin: { type: DataTypes.STRING(20), allowNull: false },
  sku: { type: DataTypes.STRING(50) },
  product_title: { type: DataTypes.STRING(500) },
  country_code: { type: DataTypes.STRING(5), defaultValue: 'US' },
  current_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_sales: { type: DataTypes.FLOAT, defaultValue: 0 },
  lead_time_days: { type: DataTypes.INTEGER, defaultValue: 14 },
  safety_stock_days: { type: DataTypes.INTEGER, defaultValue: 7 },
  reorder_quantity: { type: DataTypes.INTEGER, defaultValue: 100 },
  cost_per_unit: { type: DataTypes.FLOAT, defaultValue: 0 },
  selling_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  supplier_name: { type: DataTypes.STRING(200) },
  last_restock_date: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'inventory_items', underscored: true });

const InventoryLog = sequelize.define('InventoryLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inventory_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.ENUM('restock', 'adjustment', 'sale', 'forecast_update'), allowNull: false },
  quantity_change: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_before: { type: DataTypes.INTEGER },
  stock_after: { type: DataTypes.INTEGER },
  note: { type: DataTypes.STRING(500) },
}, { tableName: 'inventory_logs', underscored: true });

InventoryItem.hasMany(InventoryLog, { foreignKey: 'inventory_id' });
InventoryLog.belongsTo(InventoryItem, { foreignKey: 'inventory_id' });

module.exports = { InventoryItem, InventoryLog };
