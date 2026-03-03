const { PriceAlert, AlertNotification } = require('../models/PriceAlert');
const { CompetitorTracking } = require('../models/Competitor');
const emailService = require('./emailService');
const { Op } = require('sequelize');

/**
 * =============================================
 * ALERT CHECKER SERVICE
 * =============================================
 * Checks all active alerts against current price
 * Creates notifications + sends emails when triggered
 * =============================================
 */

async function checkAlerts(trackingId, currentPrice, currency, stockStatus) {
  const tracking = await CompetitorTracking.findByPk(trackingId);
  if (!tracking) return [];

  const alerts = await PriceAlert.findAll({
    where: {
      tracking_id: trackingId,
      is_active: true,
      is_triggered: false,
    },
  });

  const triggered = [];

  for (const alert of alerts) {
    let shouldTrigger = false;
    let message = '';

    switch (alert.alert_type) {
      case 'below':
        if (currentPrice > 0 && currentPrice <= alert.target_price) {
          shouldTrigger = true;
          message = `Price dropped to ${currency}${currentPrice} (target: ${currency}${alert.target_price})`;
        }
        break;

      case 'above':
        if (currentPrice > 0 && currentPrice >= alert.target_price) {
          shouldTrigger = true;
          message = `Price rose to ${currency}${currentPrice} (target: ${currency}${alert.target_price})`;
        }
        break;

      case 'change':
        if (alert.last_checked_price && alert.last_checked_price !== currentPrice) {
          shouldTrigger = true;
          const diff = currentPrice - alert.last_checked_price;
          const dir = diff > 0 ? '📈 increased' : '📉 decreased';
          message = `Price ${dir} from ${currency}${alert.last_checked_price} to ${currency}${currentPrice}`;
        }
        break;

      case 'out_of_stock':
        if (stockStatus && stockStatus.toLowerCase().includes('out')) {
          shouldTrigger = true;
          message = `Product is now Out of Stock`;
        }
        break;

      case 'back_in_stock':
        if (stockStatus && !stockStatus.toLowerCase().includes('out') && alert.last_stock_status === 'Out of Stock') {
          shouldTrigger = true;
          message = `Product is Back in Stock at ${currency}${currentPrice}`;
        }
        break;
    }

    // Update last checked values
    await alert.update({
      last_checked_price: currentPrice,
      last_stock_status: stockStatus,
    });

    if (shouldTrigger) {
      await alert.update({
        is_triggered: true,
        triggered_at: new Date(),
        triggered_price: currentPrice,
      });

      // Create in-app notification
      if (alert.notify_in_app !== false) {
        await AlertNotification.create({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: `🔔 Alert: ${tracking.asin}`,
          message,
          asin: tracking.asin,
          new_price: currentPrice,
          currency,
        });
      }

      // 📧 Send email notification
      if (alert.notify_email) {
        try {
          // Get user email
          const { User } = require('../models/User');
          const user = await User.findByPk(alert.user_id);
          if (user && user.email) {
            await emailService.sendPriceAlert(user.email, {
              asin: tracking.asin,
              productTitle: tracking.product_title,
              alertType: alert.alert_type,
              targetPrice: alert.target_price,
              currentPrice,
              currency,
              url: `https://www.amazon.com/dp/${tracking.asin}`,
            });
          }
        } catch (emailErr) {
          console.error('Email send failed (non-blocking):', emailErr.message);
        }
      }

      triggered.push({ alertId: alert.id, type: alert.alert_type, message });
    }
  }

  return triggered;
}

module.exports = { checkAlerts };
