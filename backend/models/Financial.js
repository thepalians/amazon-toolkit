const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  record_date: { type: DataTypes.DATEONLY, allowNull: false },
  record_type: { type: DataTypes.ENUM('revenue', 'expense', 'refund', 'ad_spend', 'fba_fee', 'shipping', 'cogs', 'other'), defaultValue: 'revenue' },
  category: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.STRING(500) },
  amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(5), defaultValue: 'USD' },
  asin: { type: DataTypes.STRING(20) },
  order_id: { type: DataTypes.STRING(50) },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'financial_records', underscored: true });

module.exports = { FinancialRecord };
