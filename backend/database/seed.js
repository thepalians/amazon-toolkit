/**
 * Seed script — inserts the default admin user if not already present.
 * Run once: node database/seed.js
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const AdminUser = require('../models/AdminUser');
const ApiKey = require('../models/ApiKey');
const SystemSetting = require('../models/SystemSetting');

const seed = async () => {
  await sequelize.authenticate();

  // Sync tables (create if not exist, no drop)
  await AdminUser.sync({ alter: true });
  await ApiKey.sync({ alter: true });
  await SystemSetting.sync({ alter: true });

  // Seed admin user
  const existing = await AdminUser.findOne({ where: { username: 'aqidulmumtaz' } });
  if (!existing) {
    const hash = await bcrypt.hash('Malik@241123', 12);
    await AdminUser.create({ username: 'aqidulmumtaz', password_hash: hash });
    console.log('✅ Admin user created: aqidulmumtaz');
  } else {
    console.log('ℹ️  Admin user already exists, skipping.');
  }

  // Seed default API key entries (empty placeholders)
  const services = [
    'amazon_sp_api',
    'keyword_research',
    'anthropic_claude',
    'smtp_email',
  ];

  for (const svc of services) {
    await ApiKey.findOrCreate({
      where: { service_name: svc },
      defaults: { api_key: '', api_secret: '', is_active: false },
    });
  }
  console.log('✅ API key placeholders ready.');

  // Seed default system settings
  const defaults = [
    ['site_name', 'Amazon Seller Toolkit'],
    ['maintenance_mode', 'false'],
    ['rate_limit_per_minute', '60'],
    ['allow_new_registrations', 'true'],
    ['smtp_host', ''],
    ['smtp_port', '587'],
    ['smtp_user', ''],
    ['smtp_from', ''],
  ];

  for (const [key, value] of defaults) {
    await SystemSetting.findOrCreate({
      where: { setting_key: key },
      defaults: { setting_value: value },
    });
  }
  console.log('✅ Default system settings ready.');

  await sequelize.close();
  console.log('🎉 Seed complete.');
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
