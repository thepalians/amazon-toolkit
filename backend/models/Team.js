const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  owner_id: { type: DataTypes.INTEGER, allowNull: false },
  team_name: { type: DataTypes.STRING(200), allowNull: false },
  team_slug: { type: DataTypes.STRING(100), unique: true },
  description: { type: DataTypes.TEXT },
  max_members: { type: DataTypes.INTEGER, defaultValue: 5 },
}, { tableName: 'teams', underscored: true });

const TeamMember = sequelize.define('TeamMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  team_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'), defaultValue: 'viewer' },
  invited_by: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'invited', 'removed'), defaultValue: 'invited' },
  joined_at: { type: DataTypes.DATE },
}, { tableName: 'team_members', underscored: true });

Team.hasMany(TeamMember, { foreignKey: 'team_id', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });

module.exports = { Team, TeamMember };
