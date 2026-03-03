const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  supplier_name: { type: DataTypes.STRING(300), allowNull: false },
  contact_person: { type: DataTypes.STRING(200) },
  email: { type: DataTypes.STRING(200) },
  phone: { type: DataTypes.STRING(50) },
  website: { type: DataTypes.STRING(500) },
  country: { type: DataTypes.STRING(100) },
  city: { type: DataTypes.STRING(100) },
  platform: { type: DataTypes.STRING(50), defaultValue: 'manual' },
  product_categories: { type: DataTypes.TEXT },
  min_order_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
  avg_lead_time_days: { type: DataTypes.INTEGER, defaultValue: 14 },
  payment_terms: { type: DataTypes.STRING(200) },
  rating: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'suppliers', underscored: true });

module.exports = { Supplier };
