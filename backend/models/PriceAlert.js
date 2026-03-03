const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * =============================================
 * PRICE ALERT MODEL
 * =============================================
 * Users set price alerts on tracked ASINs.
 * When price drops below target → notification
 * =============================================
 */

const PriceAlert = sequelize.define('PriceAlert', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tracking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'References competitor_tracking.id',
  },
  asin: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  alert_type: {
    type: DataTypes.ENUM('below', 'above', 'change', 'out_of_stock', 'back_in_stock'),
    defaultValue: 'below',
    comment: 'below=price drops below target, above=price goes above, change=any change',
  },
  target_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Target price threshold (null for stock alerts)',
  },
  currency: {
    type: DataTypes.STRING(5),
    defaultValue: 'INR',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_triggered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  triggered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  triggered_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  notify_in_app: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notify_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'price_alerts',
  underscored: true,
});

const AlertNotification = sequelize.define('AlertNotification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  alert_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('price_drop', 'price_increase', 'price_change', 'out_of_stock', 'back_in_stock', 'system'),
    defaultValue: 'price_change',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  asin: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  old_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  new_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'alert_notifications',
  underscored: true,
});

// Associations
PriceAlert.hasMany(AlertNotification, { foreignKey: 'alert_id', as: 'notifications' });
AlertNotification.belongsTo(PriceAlert, { foreignKey: 'alert_id' });

module.exports = { PriceAlert, AlertNotification };
