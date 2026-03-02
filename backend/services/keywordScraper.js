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
        'prefix': keyword,
      };

      const response = await axios.get(url, {
        params,
        timeout: 8000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (response.data && response.data.suggestions) {
        response.data.suggestions.forEach((item, index) => {
          results.push({
            keyword: item.value,
            source: 'amazon_autocomplete',
            position: index + 1,
            competitionLevel: this.estimateCompetition(index),
            searchVolumeEstimate: this.estimateSearchVolume(index),
            trendingScore: Math.max(100 - index * 8, 10),
          });
        });
      }
    } catch (err) {
      // Autocomplete may fail for some regions; return empty gracefully
    }

    return results;
  }

  /**
   * Generate alphabet-permuted suggestions (a-z prefix appends)
   */
  static async getAlphabetSuggestions(keyword, countryCode, countryConfig) {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const allResults = [];

    // Only do first 5 letters to avoid rate limiting
    for (const letter of letters.slice(0, 5)) {
      const permuted = `${keyword} ${letter}`;
      const suggestions = await this.getAutocompleteSuggestions(
        permuted,
        countryCode,
        countryConfig
      );
      allResults.push(...suggestions);
      // Polite delay
      await new Promise((r) => setTimeout(r, 300));
    }

    return allResults;
  }

  /**
   * Main keyword research entry point
   */
  static async research(keyword, countryCode, countryConfig, options = {}) {
    const { includeAlphabet = false, maxResults = 50 } = options;

    const baseResults = await this.getAutocompleteSuggestions(
      keyword,
      countryCode,
      countryConfig
    );

    let allResults = [...baseResults];

    if (includeAlphabet && baseResults.length < 10) {
      const alphabetResults = await this.getAlphabetSuggestions(
        keyword,
        countryCode,
        countryConfig
      );
      allResults = [...allResults, ...alphabetResults];
    }

    // Deduplicate
    const seen = new Set();
    const unique = allResults.filter((item) => {
      if (seen.has(item.keyword)) return false;
      seen.add(item.keyword);
      return true;
    });

    return unique.slice(0, maxResults).map((item) => ({
      ...item,
      marketplace: countryConfig.marketplace,
      countryCode,
      currency: countryConfig.currency,
    }));
  }

  static getMarketplaceId(countryCode) {
    const ids = {
      US: 'ATVPDKIKX0DER',
      IN: 'A21TJRUUN4KGV',
      SA: 'A17E79C6D8DWNP',
      AE: 'A2VIGQ35RCS4UG',
      GB: 'A1F83G8C2ARO7P',
      DE: 'A1PA6795UKMFR9',
      FR: 'A13V1IB3VIYZZH',
      JP: 'A1VC38T7YXB528',
      CA: 'A2EUQ1WTGCTBG2',
      AU: 'A39IBJ37TRP1C6',
      MX: 'A1AM78C64UM0Y8',
      BR: 'A2Q3Y263D00KWC',
      TR: 'A33AVAJ2PDY3EV',
      SG: 'A19VAU5U5O7RUS',
      EG: 'ARBP9OOSHTCHU',
    };
    return ids[countryCode] || ids.US;
  }

  static estimateCompetition(position) {
    if (position < 3) return 'high';
    if (position < 7) return 'medium';
    return 'low';
  }

  static estimateSearchVolume(position) {
    const volumes = [
      '50K+', '30K-50K', '20K-30K', '10K-20K', '5K-10K',
      '2K-5K', '1K-2K', '500-1K', '100-500', '< 100',
    ];
    return volumes[Math.min(position, volumes.length - 1)];
  }
}

module.exports = KeywordScraper;
