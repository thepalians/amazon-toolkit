const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  asin: {
    type: DataTypes.STRING(20),
  },
  title: {
    type: DataTypes.STRING(500),
  },
  category: {
    type: DataTypes.STRING(255),
  },
  buy_price: {
    type: DataTypes.DECIMAL(12, 2),
  },
  sell_price: {
    type: DataTypes.DECIMAL(12, 2),
  },
  weight_kg: {
    type: DataTypes.DECIMAL(8, 3),
  },
  dimensions_cm: {
    type: DataTypes.STRING(50),
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  marketplace: {
    type: DataTypes.STRING(100),
  },
  profit_amount: {
    type: DataTypes.DECIMAL(12, 2),
  },
  profit_margin: {
    type: DataTypes.DECIMAL(5, 2),
  },
  roi: {
    type: DataTypes.DECIMAL(8, 2),
  },
}, {
  tableName: 'products',
});

module.exports = Product;
