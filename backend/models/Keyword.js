const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Keyword = sequelize.define('Keyword', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seed_keyword: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  related_keyword: {
    type: DataTypes.STRING(255),
  },
  search_volume_estimate: {
    type: DataTypes.STRING(50),
  },
  competition_level: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  marketplace: {
    type: DataTypes.STRING(100),
  },
  suggestion_source: {
    type: DataTypes.STRING(50),
    defaultValue: 'amazon_autocomplete',
  },
  trending_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'keywords',
  updatedAt: false,
});

module.exports = Keyword;
