const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Webhook = sequelize.define('Webhook', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  webhook_name: { type: DataTypes.STRING(200), allowNull: false },
  webhook_url: { type: DataTypes.STRING(1000), allowNull: false },
  platform: { type: DataTypes.ENUM('slack', 'discord', 'teams', 'custom'), defaultValue: 'custom' },
  events: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  secret_key: { type: DataTypes.STRING(100) },
  last_triggered_at: { type: DataTypes.DATE },
  total_sent: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_failed: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'webhooks', underscored: true });

const WebhookLog = sequelize.define('WebhookLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  webhook_id: { type: DataTypes.INTEGER, allowNull: false },
  event_type: { type: DataTypes.STRING(100) },
  payload: { type: DataTypes.TEXT },
  response_status: { type: DataTypes.INTEGER },
  response_body: { type: DataTypes.TEXT },
  success: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'webhook_logs', underscored: true });

Webhook.hasMany(WebhookLog, { foreignKey: 'webhook_id', as: 'logs' });
WebhookLog.belongsTo(Webhook, { foreignKey: 'webhook_id' });

module.exports = { Webhook, WebhookLog };
