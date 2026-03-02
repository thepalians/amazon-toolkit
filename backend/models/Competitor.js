const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompetitorTracking = sequelize.define('CompetitorTracking', {
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
    allowNull: false,
  },
  product_title: {
    type: DataTypes.STRING(500),
  },
  competitor_name: {
    type: DataTypes.STRING(255),
  },
  country_code: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  marketplace: {
    type: DataTypes.STRING(100),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  check_interval_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 6,
  },
}, {
  tableName: 'competitor_tracking',
});

const CompetitorPriceHistory = sequelize.define('CompetitorPriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tracking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  stock_status: {
    type: DataTypes.STRING(50),
  },
  buy_box_winner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'competitor_price_history',
  timestamps: false,
});

// Associations
CompetitorTracking.hasMany(CompetitorPriceHistory, {
  foreignKey: 'tracking_id',
  as: 'priceHistory',
});
CompetitorPriceHistory.belongsTo(CompetitorTracking, {
  foreignKey: 'tracking_id',
});

module.exports = { CompetitorTracking, CompetitorPriceHistory };
