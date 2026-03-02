const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSubscription = sequelize.define('UserSubscription', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_name: { type: DataTypes.STRING(50), allowNull: false },
  duration: { type: DataTypes.ENUM('monthly', 'yearly'), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled'), defaultValue: 'active' },
  starts_at: { type: DataTypes.DATE, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  payment_id: { type: DataTypes.INTEGER, allowNull: true },
  license_key_id: { type: DataTypes.INTEGER, allowNull: true },
  auto_renew: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'user_subscriptions' });

module.exports = UserSubscription;
