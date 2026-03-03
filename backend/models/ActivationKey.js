const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivationKey = sequelize.define('ActivationKey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  plan_type: { type: DataTypes.ENUM('starter', 'professional', 'enterprise'), allowNull: false },
  duration_months: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  is_used: { type: DataTypes.TINYINT, defaultValue: 0 },
  used_by: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  used_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  amazon_order_id: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
  batch_id: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },
}, {
  tableName: 'activation_keys',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = ActivationKey;
