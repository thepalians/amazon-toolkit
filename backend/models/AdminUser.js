const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'admin_users',
});

module.exports = AdminUser;
