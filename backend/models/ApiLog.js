const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiLog = sequelize.define('ApiLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'api_logs',
  updatedAt: false,
});

module.exports = ApiLog;
