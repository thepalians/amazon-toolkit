const axios = require('axios');
const { Webhook, WebhookLog } = require('../models/Webhook');

class WebhookService {
  async trigger(userId, eventType, data) {
    try {
      const webhooks = await Webhook.findAll({
        where: { user_id: userId, is_active: true },
      });

      for (const webhook of webhooks) {
        const events = webhook.events ? JSON.parse(webhook.events) : [];
        if (events.length > 0 && !events.includes(eventType)) continue;

        const payload = this.formatPayload(webhook.platform, eventType, data);

        try {
          const response = await axios.post(webhook.webhook_url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          });

          await WebhookLog.create({
            webhook_id: webhook.id, event_type: eventType,
            payload: JSON.stringify(payload), response_status: response.status,
            response_body: JSON.stringify(response.data).substring(0, 500),
            success: true,
          });

          await webhook.update({
            last_triggered_at: new Date(),
            total_sent: webhook.total_sent + 1,
          });
        } catch (err) {
          await WebhookLog.create({
            webhook_id: webhook.id, event_type: eventType,
            payload: JSON.stringify(payload), response_status: err.response?.status || 0,
            response_body: err.message.substring(0, 500),
            success: false,
          });

          await webhook.update({ total_failed: webhook.total_failed + 1 });
        }
      }
    } catch (err) {
      console.error('Webhook trigger error:', err.message);
    }
  }

  formatPayload(platform, eventType, data) {
    const title = `Amazon Seller Toolkit — ${eventType}`;
    const message = data.message || JSON.stringify(data);

    switch (platform) {
      case 'slack':
        return {
          text: title,
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: title } },
            { type: 'section', text: { type: 'mrkdwn', text: message } },
            ...(data.asin ? [{ type: 'section', fields: [
              { type: 'mrkdwn', text: `*ASIN:* ${data.asin}` },
              ...(data.price ? [{ type: 'mrkdwn', text: `*Price:* ${data.price}` }] : []),
            ]}] : []),
          ],
        };

      case 'discord':
        return {
          content: title,
          embeds: [{
            title: eventType,
            description: message,
            color: 16750848, // Amazon orange
            fields: [
              ...(data.asin ? [{ name: 'ASIN', value: data.asin, inline: true }] : []),
              ...(data.price ? [{ name: 'Price', value: String(data.price), inline: true }] : []),
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'Amazon Seller Toolkit' },
          }],
        };

      case 'teams':
        return {
          '@type': 'MessageCard', '@context': 'http://schema.org/extensions',
          themeColor: 'FF9900', summary: title,
          sections: [{ activityTitle: title, text: message }],
        };

      default:
        return { event: eventType, timestamp: new Date().toISOString(), data };
    }
  }
}

module.exports = new WebhookService();
