const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      max: parseInt(process.env.DB_POOL_MAX) || 25,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
      acquire: 30000,
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      dateStrings: true,
      typeCast: true,
    },
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
