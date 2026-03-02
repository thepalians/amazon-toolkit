const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  display_name: { type: DataTypes.STRING(100), allowNull: false },
  price_monthly: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  price_yearly: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(5), defaultValue: 'INR' },
  features: { type: DataTypes.JSON },
  limits: { type: DataTypes.JSON },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'subscription_plans' });

module.exports = SubscriptionPlan;
