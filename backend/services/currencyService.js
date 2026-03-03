/**
 * Currency service — fetches and caches INR exchange rates
 */
const axios = require('axios');

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'JPY', 'SGD', 'SAR'];
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_INR_TO_USD = 0.012;

const FALLBACK_RATES = {
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  CAD: 0.016,
  AUD: 0.018,
  JPY: 1.79,
  SGD: 0.016,
  SAR: 0.045,
};

let ratesCache = null;
let cacheUpdatedAt = null;

async function getINRRates() {
  const now = Date.now();
  const isCached = ratesCache && cacheUpdatedAt && (now - cacheUpdatedAt) < CACHE_TTL_MS;

  if (isCached) {
    return { rates: ratesCache, cached: true, updatedAt: cacheUpdatedAt };
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/INR', { timeout: 8000 });
    const data = response.data;

    if (!data || !data.rates) {
      throw new Error('Invalid response from exchange rate API');
    }

    const rates = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        rates[currency] = data.rates[currency];
      }
    }

    ratesCache = rates;
    cacheUpdatedAt = now;

    return { rates: ratesCache, cached: false, updatedAt: cacheUpdatedAt };
  } catch (err) {
    // Return stale cache or fallback
    if (ratesCache) {
      return { rates: ratesCache, cached: true, updatedAt: cacheUpdatedAt, stale: true };
    }
    return { rates: FALLBACK_RATES, cached: false, updatedAt: null, fallback: true };
  }
}

async function convertINRtoUSD(inrAmount) {
  try {
    const { rates } = await getINRRates();
    const rate = rates.USD || FALLBACK_INR_TO_USD;
    return parseFloat((inrAmount * rate).toFixed(2));
  } catch {
    return parseFloat((inrAmount * FALLBACK_INR_TO_USD).toFixed(2));
  }
}

module.exports = { getINRRates, convertINRtoUSD, FALLBACK_RATES };
