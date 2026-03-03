const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PPCCampaign = sequelize.define('PPCCampaign', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  campaign_name: { type: DataTypes.STRING(300), allowNull: false },
  campaign_type: { type: DataTypes.ENUM('sponsored_products', 'sponsored_brands', 'sponsored_display'), defaultValue: 'sponsored_products' },
  status: { type: DataTypes.ENUM('active', 'paused', 'ended', 'draft'), defaultValue: 'active' },
  country_code: { type: DataTypes.STRING(5), defaultValue: 'US' },
  daily_budget: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_budget: { type: DataTypes.FLOAT, defaultValue: 0 },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
  targeting_type: { type: DataTypes.ENUM('automatic', 'manual'), defaultValue: 'manual' },
  bid_strategy: { type: DataTypes.ENUM('dynamic_down', 'dynamic_up_down', 'fixed'), defaultValue: 'fixed' },
  total_spend: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_sales: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_orders: { type: DataTypes.INTEGER, defaultValue: 0 },
  acos: { type: DataTypes.FLOAT, defaultValue: 0 },
  roas: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'ppc_campaigns', underscored: true });

const PPCKeyword = sequelize.define('PPCKeyword', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaign_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  keyword: { type: DataTypes.STRING(300), allowNull: false },
  match_type: { type: DataTypes.ENUM('exact', 'phrase', 'broad'), defaultValue: 'exact' },
  bid: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'paused', 'negative'), defaultValue: 'active' },
  impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  clicks: { type: DataTypes.INTEGER, defaultValue: 0 },
  spend: { type: DataTypes.FLOAT, defaultValue: 0 },
  sales: { type: DataTypes.FLOAT, defaultValue: 0 },
  orders: { type: DataTypes.INTEGER, defaultValue: 0 },
  acos: { type: DataTypes.FLOAT, defaultValue: 0 },
  cpc: { type: DataTypes.FLOAT, defaultValue: 0 },
  ctr: { type: DataTypes.FLOAT, defaultValue: 0 },
  conversion_rate: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { tableName: 'ppc_keywords', underscored: true });

PPCCampaign.hasMany(PPCKeyword, { foreignKey: 'campaign_id', as: 'keywords' });
PPCKeyword.belongsTo(PPCCampaign, { foreignKey: 'campaign_id' });

module.exports = { PPCCampaign, PPCKeyword };
