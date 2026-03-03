const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RankTracker = sequelize.define('RankTracker', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  asin: { type: DataTypes.STRING(20), allowNull: false },
  keyword: { type: DataTypes.STRING(300), allowNull: false },
  country_code: { type: DataTypes.STRING(5), defaultValue: 'US' },
  current_rank: { type: DataTypes.INTEGER, defaultValue: 0 },
  best_rank: { type: DataTypes.INTEGER, defaultValue: 0 },
  worst_rank: { type: DataTypes.INTEGER, defaultValue: 0 },
  previous_rank: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_checked: { type: DataTypes.DATE },
}, { tableName: 'rank_trackers', underscored: true });

const RankHistory = sequelize.define('RankHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tracker_id: { type: DataTypes.INTEGER, allowNull: false },
  rank_position: { type: DataTypes.INTEGER, defaultValue: 0 },
  page: { type: DataTypes.INTEGER, defaultValue: 0 },
  checked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'rank_history', underscored: true, timestamps: false });

RankTracker.hasMany(RankHistory, { foreignKey: 'tracker_id', as: 'history' });
RankHistory.belongsTo(RankTracker, { foreignKey: 'tracker_id' });

module.exports = { RankTracker, RankHistory };
