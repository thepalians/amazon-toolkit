const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'US',
  },
  marketplace: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'amazon.com',
  },
  currency: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'USD',
  },
  preferred_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
  },
  subscription_plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
    defaultValue: 'free',
  },
  api_calls_remaining: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
}, {
  tableName: 'users',
});

module.exports = User;
