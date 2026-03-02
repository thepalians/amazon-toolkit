/**
 * =============================================
 * COUNTRY CONFIGURATION SERVICE
 * =============================================
 * Ye service har country ke liye Amazon marketplace
 * settings manage karti hai - VAT, GST, FBA fees,
 * currency, language sab kuch yahan se aata hai.
 * =============================================
 */

const { sequelize } = require('../config/database');

// In-memory cache for country configs (refreshed every hour)
let countryConfigCache = {};
let cacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Complete country configurations with all marketplace details
 * This serves as default/fallback if DB is not yet populated
 */
const DEFAULT_COUNTRY_CONFIGS = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    marketplace: 'amazon.com',
    marketplaceUrl: 'https://www.amazon.com',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    language: 'en',
    timezone: 'America/New_York',
    tax: {
      type: 'sales_tax',
      vatRate: 0,
      gstRate: 0,
      salesTaxAvg: 8.0, // Average state sales tax
      importDutyAvg: 0,
    },
    fba: {
      baseFulfillmentFee: 3.22,
      weightHandlingPerKg: 0.75,
      monthlyStoragePerCBM: 2.40,
      longTermStoragePerCBM: 6.90,
      referralFeePercent: 15,
      closingFee: 1.80,
      removalFeePerUnit: 0.97,
      sizeCategories: {
        small_standard: { maxWeight: 0.34, maxDim: '38x25x5', fee: 3.22 },
        large_standard: { maxWeight: 9.07, maxDim: '63x45x35', fee: 5.26 },
        small_oversize: { maxWeight: 31.75, maxDim: '152x76', fee: 9.73 },
        large_oversize: { maxWeight: 68.04, maxDim: '274x152', fee: 89.98 },
      },
    },
    advertising: { avgCPC: 1.20, avgACoS: 25 },
  },

  IN: {
    countryCode: 'IN',
    countryName: 'India',
    marketplace: 'amazon.in',
    marketplaceUrl: 'https://www.amazon.in',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'hi-IN',
    language: 'hi',
    timezone: 'Asia/Kolkata',
    tax: {
      type: 'gst',
      vatRate: 0,
      gstRate: 18,
      gstSlabs: { essential: 5, standard: 12, general: 18, luxury: 28 },
      salesTaxAvg: 0,
      tcsRate: 1, // Tax Collected at Source for e-commerce
    },
    fba: {
      baseFulfillmentFee: 29,
      weightHandlingPerKg: 15,
      monthlyStoragePerCBM: 450,
      longTermStoragePerCBM: 900,
      referralFeePercent: 15,
      closingFee: 5,
      removalFeePerUnit: 10,
      sizeCategories: {
        standard: { maxWeight: 12, fee: 29 },
        heavy_bulky: { maxWeight: 22.5, fee: 85 },
        oversize: { maxWeight: 50, fee: 165 },
      },
    },
    advertising: { avgCPC: 8.5, avgACoS: 20 },
  },

  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    marketplace: 'amazon.sa',
    marketplaceUrl: 'https://www.amazon.sa',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    locale: 'ar-SA',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    tax: {
      type: 'vat',
      vatRate: 15,
      gstRate: 0,
      salesTaxAvg: 0,
      customsDutyAvg: 5,
    },
    fba: {
      baseFulfillmentFee: 12,
      weightHandlingPerKg: 3.5,
      monthlyStoragePerCBM: 45,
      longTermStoragePerCBM: 90,
      referralFeePercent: 15,
      closingFee: 2,
      removalFeePerUnit: 3,
      sizeCategories: {
        small: { maxWeight: 0.5, fee: 8 },
        standard: { maxWeight: 12, fee: 12 },
        oversize: { maxWeight: 30, fee: 35 },
      },
    },
    advertising: { avgCPC: 2.0, avgACoS: 22 },
  },

  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    marketplace: 'amazon.ae',
    marketplaceUrl: 'https://www.amazon.ae',
    currency: 'AED',
    currencySymbol: 'د.إ',
    locale: 'ar-AE',
    language: 'ar',
    timezone: 'Asia/Dubai',
    tax: {
      type: 'vat',
      vatRate: 5,
      gstRate: 0,
      salesTaxAvg: 0,
    },
    fba: {
      baseFulfillmentFee: 10,
      weightHandlingPerKg: 3,
      monthlyStoragePerCBM: 40,
      longTermStoragePerCBM: 80,
      referralFeePercent: 15,
      closingFee: 2,
      removalFeePerUnit: 3,
      sizeCategories: {
        small: { maxWeight: 0.5, fee: 7 },
        standard: { maxWeight: 12, fee: 10 },
        oversize: { maxWeight: 30, fee: 30 },
      },
    },
    advertising: { avgCPC: 1.8, avgACoS: 20 },
  },

  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    marketplace: 'amazon.co.uk',
    marketplaceUrl: 'https://www.amazon.co.uk',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    language: 'en',
    timezone: 'Europe/London',
    tax: {
      type: 'vat',
      vatRate: 20,
      gstRate: 0,
      salesTaxAvg: 0,
      reducedVatRate: 5,
      zeroRatedCategories: ['books', 'children_clothing', 'food'],
    },
    fba: {
      baseFulfillmentFee: 2.70,
      weightHandlingPerKg: 0.65,
      monthlyStoragePerCBM: 2.00,
      longTermStoragePerCBM: 5.50,
      referralFeePercent: 15,
      closingFee: 1.50,
      removalFeePerUnit: 0.85,
      sizeCategories: {
        small_standard: { maxWeight: 0.46, fee: 2.14 },
        large_standard: { maxWeight: 12, fee: 2.70 },
        oversize: { maxWeight: 30, fee: 6.50 },
      },
    },
    advertising: { avgCPC: 0.95, avgACoS: 22 },
  },

  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    marketplace: 'amazon.de',
    marketplaceUrl: 'https://www.amazon.de',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    language: 'de',
    timezone: 'Europe/Berlin',
    tax: {
      type: 'vat',
      vatRate: 19,
      reducedVatRate: 7,
      gstRate: 0,
      salesTaxAvg: 0,
    },
    fba: {
      baseFulfillmentFee: 3.00,
      weightHandlingPerKg: 0.70,
      monthlyStoragePerCBM: 2.20,
      longTermStoragePerCBM: 6.00,
      referralFeePercent: 15,
      closingFee: 1.50,
      removalFeePerUnit: 0.90,
      sizeCategories: {
        small_standard: { maxWeight: 0.46, fee: 2.36 },
        large_standard: { maxWeight: 12, fee: 3.00 },
        oversize: { maxWeight: 30, fee: 7.00 },
      },
    },
    advertising: { avgCPC: 0.85, avgACoS: 20 },
  },

  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    marketplace: 'amazon.co.jp',
    marketplaceUrl: 'https://www.amazon.co.jp',
    currency: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    tax: {
      type: 'consumption_tax',
      vatRate: 10,
      reducedRate: 8,
      gstRate: 0,
      salesTaxAvg: 0,
    },
    fba: {
      baseFulfillmentFee: 400,
      weightHandlingPerKg: 90,
      monthlyStoragePerCBM: 250,
      longTermStoragePerCBM: 500,
      referralFeePercent: 15,
      closingFee: 80,
      removalFeePerUnit: 50,
      sizeCategories: {
        small: { maxWeight: 1, fee: 288 },
        standard: { maxWeight: 9, fee: 400 },
        oversize: { maxWeight: 40, fee: 1500 },
      },
    },
    advertising: { avgCPC: 100, avgACoS: 18 },
  },

  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    marketplace: 'amazon.ca',
    marketplaceUrl: 'https://www.amazon.ca',
    currency: 'CAD',
    currencySymbol: 'C$',
    locale: 'en-CA',
    language: 'en',
    timezone: 'America/Toronto',
    tax: {
      type: 'gst_pst',
      vatRate: 0,
      gstRate: 5,
      pstRates: { BC: 7, SK: 6, MB: 7, QC: 9.975 },
      hstRates: { ON: 13, NB: 15, NS: 15, NL: 15, PE: 15 },
      salesTaxAvg: 12,
    },
    fba: {
      baseFulfillmentFee: 4.00,
      weightHandlingPerKg: 0.85,
      monthlyStoragePerCBM: 2.50,
      longTermStoragePerCBM: 7.00,
      referralFeePercent: 15,
      closingFee: 1.80,
      removalFeePerUnit: 1.00,
      sizeCategories: {
        small_standard: { maxWeight: 0.5, fee: 3.54 },
        large_standard: { maxWeight: 9, fee: 5.50 },
        oversize: { maxWeight: 30, fee: 10.00 },
      },
    },
    advertising: { avgCPC: 1.10, avgACoS: 24 },
  },

  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    marketplace: 'amazon.com.au',
    marketplaceUrl: 'https://www.amazon.com.au',
    currency: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    language: 'en',
    timezone: 'Australia/Sydney',
    tax: {
      type: 'gst',
      vatRate: 0,
      gstRate: 10,
      salesTaxAvg: 0,
    },
    fba: {
      baseFulfillmentFee: 3.50,
      weightHandlingPerKg: 0.80,
      monthlyStoragePerCBM: 2.80,
      longTermStoragePerCBM: 7.50,
      referralFeePercent: 15,
      closingFee: 2.00,
      removalFeePerUnit: 1.10,
      sizeCategories: {
        standard: { maxWeight: 12, fee: 3.50 },
        oversize: { maxWeight: 30, fee: 8.00 },
      },
    },
    advertising: { avgCPC: 1.30, avgACoS: 23 },
  },
};

/**
 * Get configuration for a specific country
 */
const getCountryConfig = async (countryCode) => {
  const code = countryCode.toUpperCase();

  // Check cache first
  if (countryConfigCache[code] && Date.now() - cacheTimestamp < CACHE_TTL) {
    return countryConfigCache[code];
  }

  // Try database
  try {
    const [rows] = await sequelize.query(
      'SELECT * FROM country_configs WHERE country_code = ? AND is_active = TRUE',
      { replacements: [code] }
    );

    if (rows.length > 0) {
      const dbConfig = rows[0];
      const merged = {
        ...DEFAULT_COUNTRY_CONFIGS[code],
        ...dbConfig,
      };
      countryConfigCache[code] = merged;
      cacheTimestamp = Date.now();
      return merged;
    }
  } catch (err) {
    console.warn('DB lookup failed, using defaults:', err.message);
  }

  // Fallback to defaults
  if (DEFAULT_COUNTRY_CONFIGS[code]) {
    return DEFAULT_COUNTRY_CONFIGS[code];
  }

  // Ultimate fallback: US config
  return DEFAULT_COUNTRY_CONFIGS['US'];
};

/**
 * Get all supported countries
 */
const getAllCountries = () => {
  return Object.entries(DEFAULT_COUNTRY_CONFIGS).map(([code, config]) => ({
    code,
    name: config.countryName,
    marketplace: config.marketplace,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    flag: getCountryFlag(code),
  }));
};

/**
 * Get country flag emoji from country code
 */
const getCountryFlag = (countryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

/**
 * Detect country from various sources
 */
const detectCountry = (req) => {
  // 1. Check explicit header
  if (req.headers['x-country-code']) {
    return req.headers['x-country-code'].toUpperCase();
  }

  // 2. Check query parameter
  if (req.query.country) {
    return req.query.country.toUpperCase();
  }

  // 3. Check user profile
  if (req.user && req.user.country_code) {
    return req.user.country_code.toUpperCase();
  }

  // 4. Check Accept-Language header
  const acceptLang = req.headers['accept-language'];
  if (acceptLang) {
    const langMap = {
      'hi': 'IN', 'ar': 'SA', 'de': 'DE', 'fr': 'FR',
      'ja': 'JP', 'pt': 'BR', 'tr': 'TR', 'es': 'MX',
    };
    const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase();
    if (langMap[primaryLang]) {
      return langMap[primaryLang];
    }
  }

  // 5. Default
  return 'US';
};

/**
 * Format currency based on country config
 */
const formatCurrency = (amount, countryCode) => {
  const config = DEFAULT_COUNTRY_CONFIGS[countryCode] || DEFAULT_COUNTRY_CONFIGS['US'];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
};

module.exports = {
  getCountryConfig,
  getAllCountries,
  getCountryFlag,
  detectCountry,
  formatCurrency,
  DEFAULT_COUNTRY_CONFIGS,
};
