const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_title: { type: DataTypes.STRING(300) },
  model: { type: DataTypes.STRING(50), defaultValue: 'claude' },
  total_messages: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'chat_sessions', underscored: true });

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'assistant', 'system'), defaultValue: 'user' },
  content: { type: DataTypes.TEXT, allowNull: false },
  tokens_used: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'chat_messages', underscored: true });

ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id' });

module.exports = { ChatSession, ChatMessage };
