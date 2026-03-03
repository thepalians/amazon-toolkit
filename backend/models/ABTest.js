const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ABTest = sequelize.define('ABTest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  asin: { type: DataTypes.STRING(20), allowNull: false },
  test_name: { type: DataTypes.STRING(300), allowNull: false },
  test_type: { type: DataTypes.ENUM('title', 'image', 'bullets', 'price', 'description'), defaultValue: 'title' },
  status: { type: DataTypes.ENUM('running', 'completed', 'paused', 'draft'), defaultValue: 'draft' },
  variant_a: { type: DataTypes.TEXT, allowNull: false },
  variant_b: { type: DataTypes.TEXT, allowNull: false },
  variant_a_views: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_a_clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_a_sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_a_revenue: { type: DataTypes.FLOAT, defaultValue: 0 },
  variant_b_views: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_b_clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_b_sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  variant_b_revenue: { type: DataTypes.FLOAT, defaultValue: 0 },
  winner: { type: DataTypes.ENUM('A', 'B', 'none'), defaultValue: 'none' },
  confidence: { type: DataTypes.FLOAT, defaultValue: 0 },
  start_date: { type: DataTypes.DATE },
  end_date: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'ab_tests', underscored: true });

module.exports = { ABTest };
