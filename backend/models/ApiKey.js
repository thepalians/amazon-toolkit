const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  service_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  api_key: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  api_secret: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'api_keys',
});

module.exports = ApiKey;
