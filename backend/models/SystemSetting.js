const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'system_settings',
});

module.exports = SystemSetting;
