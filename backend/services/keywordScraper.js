/**
 * =============================================
 * KEYWORD RESEARCH SERVICE
 * =============================================
 * Amazon Autocomplete API se public keyword
 * suggestions scrape karta hai. Har country ke
 * marketplace ke liye alag domain use hota hai.
 * =============================================
 */

const axios = require('axios');
const cheerio = require('cheerio');

class KeywordScraper {
  /**
   * Get keyword suggestions from Amazon Autocomplete
   * @param {string} keyword - Seed keyword
   * @param {string} countryCode - Country code
   * @param {Object} countryConfig - Country configuration
   */
  static async getAutocompleteSuggestions(keyword, countryCode, countryConfig) {
    const marketplace = countryConfig.marketplace || 'amazon.com';
    const results = [];

    try {
      // Amazon Autocomplete API (publicly accessible)
      const url = `https://completion.${marketplace}/api/2017/suggestions`;
      const params = {
        'session-id': `${Date.now()}`,
        'customer-id': '',
        'request-id': `${Date.now()}`,
        'page-type': 'Gateway',
        'lop': countryConfig.locale || 'en_US',
        'site-variant': 'desktop',
        'client-info': 'amazon-search-ui',
        'mid': this.getMarketplaceId(countryCode),
        'alias': 'aps',
        'b2b': '0',
        'fresh': '0',
        'ks': '80',
