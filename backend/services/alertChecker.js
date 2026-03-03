/**
 * =============================================
 * ALERT CHECKER SERVICE
 * =============================================
 * Called after every price check to evaluate
 * if any alerts should be triggered.
 * =============================================
 */

const { PriceAlert, AlertNotification } = require('../models/PriceAlert');
const { Op } = require('sequelize');

async function checkAlerts(trackingId, newPrice, currency, stockStatus) {
  try {
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
      let notifType = 'price_change';
      let title = '';
      let message = '';

      const priceNum = parseFloat(newPrice);
      const targetNum = parseFloat(alert.target_price);

      switch (alert.alert_type) {
        case 'below':
          if (priceNum <= targetNum) {
            shouldTrigger = true;
            notifType = 'price_drop';
            title = `🔔 Price Drop Alert: ${alert.asin}`;
            message = `Price dropped to ${currency}${priceNum} (target: ${currency}${targetNum})`;
          }
          break;

        case 'above':
          if (priceNum >= targetNum) {
            shouldTrigger = true;
            notifType = 'price_increase';
            title = `📈 Price Increase Alert: ${alert.asin}`;
            message = `Price went up to ${currency}${priceNum} (target: ${currency}${targetNum})`;
          }
          break;

        case 'change':
          shouldTrigger = true;
          notifType = 'price_change';
          title = `💰 Price Changed: ${alert.asin}`;
          message = `Current price: ${currency}${priceNum}`;
          break;

        case 'out_of_stock':
          if (stockStatus && stockStatus.toLowerCase().includes('out')) {
            shouldTrigger = true;
            notifType = 'out_of_stock';
            title = `⚠️ Out of Stock: ${alert.asin}`;
            message = `Product is now out of stock.`;
          }
          break;

        case 'back_in_stock':
          if (stockStatus && stockStatus.toLowerCase().includes('in stock') && !stockStatus.toLowerCase().includes('out')) {
            shouldTrigger = true;
            notifType = 'back_in_stock';
            title = `✅ Back in Stock: ${alert.asin}`;
            message = `Product is back in stock at ${currency}${priceNum}`;
          }
          break;
      }

      if (shouldTrigger) {
        // Mark alert as triggered
        alert.is_triggered = true;
        alert.triggered_at = new Date();
        alert.triggered_price = priceNum;
        await alert.save();

        // Create notification
        if (alert.notify_in_app) {
          await AlertNotification.create({
            user_id: alert.user_id,
            alert_id: alert.id,
            type: notifType,
            title,
            message,
            asin: alert.asin,
            new_price: priceNum,
            currency,
          });
        }

        triggered.push({ alertId: alert.id, type: notifType, title });
      }
    }

    return triggered;
  } catch (err) {
    console.error('Alert checker error:', err);
    return [];
  }
}

module.exports = { checkAlerts };
