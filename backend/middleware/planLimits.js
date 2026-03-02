const ApiLog = require('../models/ApiLog');
const UserSubscription = require('../models/UserSubscription');
const { Op } = require('sequelize');

// Plan limits: -1 means unlimited
const PLAN_LIMITS = {
  free:    { profit_calculator: 5,  keyword_research: 3,  listing_optimizer: 1,  competitor_monitor: 1  },
  basic:   { profit_calculator: -1, keyword_research: 20, listing_optimizer: 5,  competitor_monitor: 5  },
  premium: { profit_calculator: -1, keyword_research: -1, listing_optimizer: 20, competitor_monitor: 20 },
  pro:     { profit_calculator: -1, keyword_research: -1, listing_optimizer: -1, competitor_monitor: -1 },
  // legacy alias
  enterprise: { profit_calculator: -1, keyword_research: -1, listing_optimizer: -1, competitor_monitor: -1 },
};

async function getActivePlan(user) {
  // Check for active subscription
  const now = new Date();
  const sub = await UserSubscription.findOne({
    where: { user_id: user.id, status: 'active', expires_at: { [Op.gt]: now } },
    order: [['expires_at', 'DESC']],
  });
  if (sub) return sub.plan_name;
  return user.subscription_plan || 'free';
}

function checkPlanLimit(feature) {
  return async (req, res, next) => {
    try {
      const plan = await getActivePlan(req.user);
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
      const limit = limits[feature];

      if (limit === -1) return next(); // unlimited

      // Count today's usage for this user and feature
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endpointPrefixes = {
        profit_calculator: '/api/profit',
        keyword_research: '/api/keywords',
        listing_optimizer: '/api/listing',
        competitor_monitor: '/api/competitor',
      };
      const prefix = endpointPrefixes[feature] || `/api/${feature}`;

      const usageCount = await ApiLog.count({
        where: {
          user_id: req.user.id,
          endpoint: { [Op.like]: `${prefix}%` },
          created_at: { [Op.gte]: today },
        },
      });

      if (usageCount >= limit) {
        const upgradeMap = { free: 'Basic', basic: 'Premium', premium: 'Pro' };
        const upgradeTo = upgradeMap[plan] || 'a higher plan';
        return res.status(403).json({
          success: false,
          message: `Daily limit reached for your ${plan} plan. Upgrade to ${upgradeTo} to get more usage.`,
          limit,
          used: usageCount,
          plan,
        });
      }

      req.userPlan = plan;
      next();
    } catch (err) {
      console.error('planLimits error:', err);
      next(); // fail open
    }
  };
}

module.exports = { checkPlanLimit, getActivePlan, PLAN_LIMITS };
