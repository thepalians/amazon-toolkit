const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SourcingCalculation = sequelize.define('SourcingCalculation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_name: { type: DataTypes.STRING(300) },
  source_country: { type: DataTypes.STRING(50), defaultValue: 'China' },
  destination_country: { type: DataTypes.STRING(50), defaultValue: 'US' },
  unit_cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  units_per_order: { type: DataTypes.INTEGER, defaultValue: 500 },
  shipping_method: { type: DataTypes.ENUM('sea', 'air', 'express'), defaultValue: 'sea' },
  shipping_cost_per_unit: { type: DataTypes.FLOAT, defaultValue: 0 },
  customs_duty_percent: { type: DataTypes.FLOAT, defaultValue: 0 },
  amazon_referral_percent: { type: DataTypes.FLOAT, defaultValue: 15 },
  fba_fee_per_unit: { type: DataTypes.FLOAT, defaultValue: 0 },
  target_sell_price: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'sourcing_calculations', underscored: true });

module.exports = { SourcingCalculation };
