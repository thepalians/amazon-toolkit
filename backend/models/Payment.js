const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_name: { type: DataTypes.STRING(50), allowNull: false },
  duration: { type: DataTypes.ENUM('monthly', 'yearly'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(5), defaultValue: 'INR' },
  payment_gateway: { type: DataTypes.ENUM('razorpay', 'paypal', 'license_key', 'admin'), allowNull: false },
  gateway_order_id: { type: DataTypes.STRING(255), allowNull: true },
  gateway_payment_id: { type: DataTypes.STRING(255), allowNull: true },
  gateway_signature: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
  license_key_id: { type: DataTypes.INTEGER, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'payments' });

module.exports = Payment;
