const nodemailer = require('nodemailer');

/**
 * =============================================
 * EMAIL NOTIFICATION SERVICE
 * =============================================
 * Sends email notifications for:
 * - Price alerts triggered
 * - Welcome emails
 * - Subscription updates
 * =============================================
 */

class EmailService {
  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.transporter = null;

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendMail(to, subject, html) {
    if (!this.enabled || !this.transporter) {
      console.log(`📧 [Email Disabled] To: ${to} | Subject: ${subject}`);
      return { sent: false, reason: 'Email disabled' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Amazon Seller Toolkit'}" <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error(`📧 Email failed to ${to}:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  // =====================
  // EMAIL TEMPLATES
  // =====================

  async sendPriceAlert(to, data) {
    const { asin, productTitle, alertType, targetPrice, currentPrice, currency, url } = data;

    const alertLabels = {
      below: '📉 Price Dropped Below Target',
      above: '📈 Price Went Above Target',
      change: '💰 Price Changed',
      out_of_stock: '⚠️ Product Out of Stock',
      back_in_stock: '✅ Product Back in Stock',
    };

    const subject = `${alertLabels[alertType] || '🔔 Price Alert'} — ${asin}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: #fff; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: 800; color: #FF9900; }
          .alert-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; margin: 10px 0; }
          .badge-red { background: #fef2f2; color: #dc2626; }
          .badge-green { background: #f0fdf4; color: #16a34a; }
          .badge-yellow { background: #fffbeb; color: #d97706; }
          .price-box { text-align: center; padding: 20px; background: #f9fafb; border-radius: 10px; margin: 16px 0; }
          .price { font-size: 36px; font-weight: 800; color: #111; }
          .target { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .details { margin: 16px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .detail-label { color: #6b7280; }
          .detail-value { font-weight: 600; color: #111; }
          .btn { display: inline-block; padding: 12px 28px; background: #FF9900; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 16px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛒 Amazon Seller Toolkit</div>
          </div>
          <div class="card">
            <div style="text-align: center;">
              <span class="alert-badge ${alertType === 'below' || alertType === 'out_of_stock' ? 'badge-red' : alertType === 'back_in_stock' ? 'badge-green' : 'badge-yellow'}">
                ${alertLabels[alertType] || '🔔 Price Alert'}
              </span>
            </div>

            <div class="price-box">
              <div class="price">${currency}${currentPrice}</div>
              ${targetPrice ? `<div class="target">Target: ${currency}${targetPrice}</div>` : ''}
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">ASIN</span>
                <span class="detail-value">${asin}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Product</span>
                <span class="detail-value">${productTitle || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alert Type</span>
                <span class="detail-value">${alertType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Checked At</span>
                <span class="detail-value">${new Date().toLocaleString()}</span>
              </div>
            </div>

            ${url ? `<div style="text-align: center;"><a href="${url}" class="btn">View on Amazon →</a></div>` : ''}
          </div>
          <div class="footer">
            <p>You received this because you set a price alert on Amazon Seller Toolkit.</p>
            <p>© ${new Date().getFullYear()} Palians — Amazon Seller Toolkit</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(to, subject, html);
  }

  async sendWelcomeEmail(to, fullName) {
    const subject = '🎉 Welcome to Amazon Seller Toolkit!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: #fff; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: 800; color: #FF9900; }
          h2 { color: #111; font-size: 22px; text-align: center; }
          .tools { margin: 20px 0; }
          .tool { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 28px; background: #FF9900; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛒 Amazon Seller Toolkit</div>
          </div>
          <div class="card">
            <h2>Welcome, ${fullName || 'Seller'}! 🎉</h2>
            <p style="text-align: center; color: #6b7280; font-size: 15px;">
              Your Amazon seller journey just got a powerful upgrade.
            </p>
            <div class="tools">
              <div class="tool">📊 <strong>Sales Estimator</strong> — Estimate sales from BSR</div>
              <div class="tool">🏷️ <strong>FBA Fee Calculator</strong> — Know every fee</div>
              <div class="tool">🔔 <strong>Price Alerts</strong> — Get notified on price changes</div>
              <div class="tool">🔍 <strong>Keyword Research</strong> — Find winning keywords</div>
              <div class="tool">✍️ <strong>AI Listing Optimizer</strong> — Claude AI powered</div>
              <div class="tool">👁️ <strong>Competitor Monitor</strong> — Track competitor prices</div>
              <div class="tool">📈 <strong>Listing Score</strong> — Rate your listings</div>
              <div class="tool">💰 <strong>Profit Calculator</strong> — Calculate real profit</div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://palians.com/amazon-seller-toolkit" class="btn">Open Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Palians — Amazon Seller Toolkit</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(to, subject, html);
  }
}

module.exports = new EmailService();
