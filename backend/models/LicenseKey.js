const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LicenseKey = sequelize.define('LicenseKey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  license_key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  plan_name: { type: DataTypes.STRING(50), allowNull: false },
  duration: { type: DataTypes.ENUM('monthly', 'yearly'), allowNull: false },
  status: { type: DataTypes.ENUM('unused', 'active', 'expired', 'revoked'), defaultValue: 'unused' },
  activated_by: { type: DataTypes.INTEGER, allowNull: true },
  activated_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'license_keys' });

module.exports = LicenseKey;
