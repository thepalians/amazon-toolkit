/**
 * =============================================
 * COMPETITOR PRICE MONITOR SERVICE
 * =============================================
 * Amazon product pages se competitor prices
 * scrape karta hai aur price history track karta
 * hai. Har country ke marketplace ke liye kaam
 * karta hai.
 * Now integrates with Price Alert system.
 * =============================================
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { CompetitorTracking, CompetitorPriceHistory } = require('../models/Competitor');
const { checkAlerts } = require('./alertChecker');

class CompetitorMonitor {
  static async scrapeProductData(asin, countryCode, countryConfig) {
    const marketplace = countryConfig.marketplaceUrl || `https://www.amazon.com`;
    const url = `${marketplace}/dp/${asin}`;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': countryConfig.locale || 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    };

    try {
      const response = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);

      let priceText =
        $('#priceblock_ourprice').text().trim() ||
        $('#priceblock_dealprice').text().trim() ||
        $('.a-price .a-offscreen').first().text().trim() ||
        $('#price_inside_buybox').text().trim() ||
        '';

      const currency = countryConfig.currency || 'USD';
      const price = this.extractPrice(priceText, currency);

      const title =
        $('#productTitle').text().trim() ||
        $('h1.a-size-large').text().trim() ||
        '';

      const stockText =
        $('#availability span').text().trim() ||
        $('#outOfStock').text().trim() ||
        '';
      const inStock =
        !stockText.toLowerCase().includes('unavailable') &&
        !stockText.toLowerCase().includes('out of stock') &&
        price > 0;

      const ratingText = $('.a-icon-star .a-icon-alt').first().text().trim();
      const rating = parseFloat(ratingText) || 0;

      const reviewText = $('#acrCustomerReviewText').text().trim();
      const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, ''), 10) || 0;

      const buyBoxSeller =
        $('#sellerProfileTriggerId').text().trim() ||
        $('.tabular-buybox-text[tabular-attribute-name="Sold by"] span').text().trim() ||
        'Amazon';

      return {
        asin, title, price, currency, inStock,
        stockStatus: inStock ? 'In Stock' : 'Out of Stock',
        rating, reviewCount, buyBoxSeller,
        marketplace: countryConfig.marketplace,
        scrapedAt: new Date().toISOString(),
        url,
      };
    } catch (err) {
      throw new Error(`Failed to scrape ASIN ${asin}: ${err.message}`);
    }
  }

  static extractPrice(priceText, currency) {
    if (!priceText) return 0;
    let cleaned = priceText.replace(/[^0-9.,]/g, '');
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  static async addTracking(userId, asin, countryCode, marketplace, options = {}) {
    const existing = await CompetitorTracking.findOne({
      where: { user_id: userId, asin, country_code: countryCode },
    });

    if (existing) {
      await existing.update({ is_active: true });
      return existing;
    }

    return CompetitorTracking.create({
      user_id: userId, asin, country_code: countryCode, marketplace,
      product_title: options.title || '',
      competitor_name: options.competitorName || '',
      check_interval_hours: options.intervalHours || 6,
      is_active: true,
    });
  }

  static async savePriceSnapshot(trackingId, priceData) {
    return CompetitorPriceHistory.create({
      tracking_id: trackingId,
      price: priceData.price,
      currency: priceData.currency,
      stock_status: priceData.stockStatus,
      buy_box_winner: priceData.buyBoxSeller?.toLowerCase().includes('amazon') || false,
      rating: priceData.rating || null,
      review_count: priceData.reviewCount || 0,
    });
  }

  /**
   * Run price check + trigger alerts
   */
  static async runPriceCheck(trackingRecord, countryConfig) {
    const data = await this.scrapeProductData(
      trackingRecord.asin,
      trackingRecord.country_code,
      countryConfig
    );

    // Update product title if not set
    if (!trackingRecord.product_title && data.title) {
      await trackingRecord.update({ product_title: data.title });
    }

    await this.savePriceSnapshot(trackingRecord.id, data);

    // 🔔 Check price alerts after every price check
    try {
      const triggeredAlerts = await checkAlerts(
        trackingRecord.id,
        data.price,
        data.currency,
        data.stockStatus
      );
      if (triggeredAlerts.length > 0) {
        console.log(`🔔 ${triggeredAlerts.length} alert(s) triggered for ASIN ${trackingRecord.asin}`);
      }
      data.triggeredAlerts = triggeredAlerts;
    } catch (alertErr) {
      console.error('Alert check failed (non-blocking):', alertErr.message);
      data.triggeredAlerts = [];
    }

    return data;
  }

  static async getPriceHistory(trackingId, limit = 30) {
    return CompetitorPriceHistory.findAll({
      where: { tracking_id: trackingId },
      order: [['recorded_at', 'DESC']],
      limit,
    });
  }
}

module.exports = CompetitorMonitor;
