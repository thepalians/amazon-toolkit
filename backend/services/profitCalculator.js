/**
 * =============================================
 * PROFIT CALCULATOR SERVICE
 * =============================================
 * Har country ke hisab se VAT/GST, FBA fees,
 * referral fees, closing fees sab calculate karta
 * hai aur exact profit, margin, ROI batata hai.
 * =============================================
 */

const { getCountryConfig, formatCurrency } = require('./countryConfig');

class ProfitCalculator {
  /**
   * Calculate complete profit breakdown
   * @param {Object} params
   * @param {number} params.buyPrice - Product cost price
   * @param {number} params.sellPrice - Selling price on Amazon
   * @param {number} params.weightKg - Product weight in KG
   * @param {string} params.countryCode - Country code (US, IN, SA, etc.)
   * @param {number} params.shippingCost - Shipping to FBA warehouse
   * @param {string} params.category - Product category
   * @param {number} params.quantity - Number of units
   * @param {boolean} params.isFBA - Using FBA or FBM
   * @param {string} params.gstSlab - GST slab for India (essential/standard/general/luxury)
   * @param {number} params.advertisingSpend - Advertising cost per unit
   */
  static async calculate(params) {
    const {
      buyPrice,
      sellPrice,
      weightKg = 0.5,
      countryCode = 'US',
      shippingCost = 0,
      category = 'general',
      quantity = 1,
      isFBA = true,
      gstSlab = 'general',
      advertisingSpend = 0,
    } = params;

    const config = await getCountryConfig(countryCode);

    // ---- 1. CALCULATE TAX ----
    const taxBreakdown = this.calculateTax(sellPrice, config, gstSlab);

    // ---- 2. CALCULATE AMAZON FEES ----
    const amazonFees = this.calculateAmazonFees(sellPrice, weightKg, config, isFBA, category);

    // ---- 3. CALCULATE TOTAL COSTS ----
    const totalCostPerUnit =
      buyPrice +
      shippingCost +
      taxBreakdown.taxAmount +
      amazonFees.totalFees +
      advertisingSpend;

    // ---- 4. CALCULATE PROFIT ----
    const profitPerUnit = sellPrice - totalCostPerUnit;
    const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;
    const roi = buyPrice > 0 ? (profitPerUnit / buyPrice) * 100 : 0;

    // ---- 5. BULK CALCULATIONS ----
    const totalInvestment = (buyPrice + shippingCost) * quantity;
    const totalRevenue = sellPrice * quantity;
    const totalProfit = profitPerUnit * quantity;

    // ---- 6. BREAKEVEN ANALYSIS ----
    const breakevenPrice = totalCostPerUnit;
    const breakevenUnits =
      profitPerUnit > 0 ? Math.ceil(totalInvestment / profitPerUnit) : Infinity;

    return {
      success: true,
      country: {
        code: config.countryCode,
        name: config.countryName,
        marketplace: config.marketplace,
        currency: config.currency,
        currencySymbol: config.currencySymbol || config.tax?.currencySymbol || '$',
      },
      pricing: {
        buyPrice: this.round(buyPrice),
        sellPrice: this.round(sellPrice),
        shippingCost: this.round(shippingCost),
        advertisingSpend: this.round(advertisingSpend),
      },
      tax: taxBreakdown,
      amazonFees: amazonFees,
      profit: {
        profitPerUnit: this.round(profitPerUnit),
        profitMargin: this.round(profitMargin),
        roi: this.round(roi),
        isProfitable: profitPerUnit > 0,
        profitRating: this.getProfitRating(profitMargin),
      },
      bulk: {
        quantity,
        totalInvestment: this.round(totalInvestment),
        totalRevenue: this.round(totalRevenue),
        totalProfit: this.round(totalProfit),
        totalFees: this.round(amazonFees.totalFees * quantity),
        totalTax: this.round(taxBreakdown.taxAmount * quantity),
      },
      breakeven: {
        breakevenPrice: this.round(breakevenPrice),
        breakevenUnits,
        formattedBreakevenPrice: formatCurrency(breakevenPrice, countryCode),
      },
      costBreakdown: {
        productCost: this.round((buyPrice / sellPrice) * 100),
        shippingPercent: this.round((shippingCost / sellPrice) * 100),
        taxPercent: this.round((taxBreakdown.taxAmount / sellPrice) * 100),
        amazonFeesPercent: this.round((amazonFees.totalFees / sellPrice) * 100),
        advertisingPercent: this.round((advertisingSpend / sellPrice) * 100),
        profitPercent: this.round(profitMargin),
      },
    };
  }

  /**
   * Calculate tax based on country's tax system
   */
  static calculateTax(sellPrice, config, gstSlab = 'general') {
    const tax = config.tax || {};
    const result = {
      taxType: tax.type || 'none',
      taxRate: 0,
      taxAmount: 0,
      details: {},
    };

    switch (tax.type) {
      case 'vat':
        result.taxRate = tax.vatRate || 0;
        result.taxAmount = sellPrice * (result.taxRate / 100);
        result.details = {
          label: 'VAT',
          description: `Value Added Tax @ ${result.taxRate}%`,
        };
        break;

      case 'gst':
        // India GST with slabs
        if (config.countryCode === 'IN' && tax.gstSlabs) {
          result.taxRate = tax.gstSlabs[gstSlab] || tax.gstRate || 18;
        } else {
          result.taxRate = tax.gstRate || 0;
        }
        result.taxAmount = sellPrice * (result.taxRate / 100);
        // Add TCS for India
        if (tax.tcsRate) {
          const tcs = sellPrice * (tax.tcsRate / 100);
          result.taxAmount += tcs;
          result.details.tcs = {
            rate: tax.tcsRate,
            amount: this.round(tcs),
            label: 'TCS (Tax Collected at Source)',
          };
        }
        result.details = {
          ...result.details,
          label: 'GST',
          slab: gstSlab,
          description: `GST @ ${result.taxRate}%`,
        };
        break;

      case 'gst_pst':
        // Canada GST + PST/HST
        result.taxRate = (tax.gstRate || 5) + (tax.salesTaxAvg || 7);
        result.taxAmount = sellPrice * (result.taxRate / 100);
        result.details = {
          label: 'GST + PST/HST',
          gst: tax.gstRate,
          avgProvincialTax: tax.salesTaxAvg,
          description: `GST ${tax.gstRate}% + Avg Provincial ${tax.salesTaxAvg}%`,
        };
        break;

      case 'sales_tax':
        result.taxRate = tax.salesTaxAvg || 0;
        result.taxAmount = sellPrice * (result.taxRate / 100);
        result.details = {
          label: 'Sales Tax',
          description: `Avg Sales Tax @ ${result.taxRate}%`,
          note: 'Varies by state',
        };
        break;

      case 'consumption_tax':
        result.taxRate = tax.vatRate || 10;
        result.taxAmount = sellPrice * (result.taxRate / 100);
        result.details = {
          label: 'Consumption Tax',
          description: `Consumption Tax @ ${result.taxRate}%`,
        };
        break;

      default:
        result.taxRate = 0;
        result.taxAmount = 0;
        result.details = { label: 'No Tax', description: 'No applicable tax' };
    }

    result.taxAmount = this.round(result.taxAmount);
    return result;
  }

  /**
   * Calculate all Amazon fees (FBA/FBM, referral, closing)
   */
  static calculateAmazonFees(sellPrice, weightKg, config, isFBA = true, category = 'general') {
    const fba = config.fba || {};

    // Referral Fee (usually 15% but varies by category)
    const referralFeePercent = this.getCategoryReferralFee(category, fba.referralFeePercent || 15);
    const referralFee = sellPrice * (referralFeePercent / 100);

    // Closing Fee
    const closingFee = fba.closingFee || 0;

    let fulfillmentFee = 0;
    let storageFee = 0;

    if (isFBA) {
      // FBA Fulfillment Fee
      fulfillmentFee = (fba.baseFulfillmentFee || 0) + (weightKg * (fba.weightHandlingPerKg || 0));

      // Monthly Storage Fee (estimated per unit)
      // Approximate: assume product occupies 0.001 CBM
      const estimatedCBM = 0.001 * weightKg;
      storageFee = estimatedCBM * (fba.monthlyStoragePerCBM || 0);
    }

    const totalFees = referralFee + closingFee + fulfillmentFee + storageFee;

    return {
      referralFee: this.round(referralFee),
      referralFeePercent,
      closingFee: this.round(closingFee),
      fulfillmentFee: this.round(fulfillmentFee),
      storageFee: this.round(storageFee),
      totalFees: this.round(totalFees),
      isFBA,
      breakdown: {
        referral: `${referralFeePercent}% of sell price`,
        closing: `Fixed fee`,
        fulfillment: isFBA
          ? `Base: ${fba.baseFulfillmentFee} + Weight: ${weightKg}kg × ${fba.weightHandlingPerKg}`
          : 'N/A (FBM)',
        storage: isFBA ? `${fba.monthlyStoragePerCBM}/CBM monthly` : 'N/A (FBM)',
      },
    };
  }

  /**
   * Get referral fee based on product category
   */
  static getCategoryReferralFee(category, defaultFee) {
    const categoryFees = {
      electronics: 8,
      computers: 8,
      books: 15,
      clothing: 17,
      shoes: 15,
      jewelry: 20,
      watches: 16,
      grocery: 8,
      health: 15,
      beauty: 15,
      toys: 15,
      sports: 15,
      automotive: 12,
      home: 15,
      garden: 15,
      kitchen: 15,
      tools: 15,
      pet: 15,
      baby: 15,
      general: defaultFee,
    };
    return categoryFees[category.toLowerCase()] || defaultFee;
  }

  /**
   * Rate profit margin quality
   */
  static getProfitRating(margin) {
    if (margin >= 30) return { rating: 'excellent', emoji: '🟢', label: 'Excellent' };
    if (margin >= 20) return { rating: 'good', emoji: '🟡', label: 'Good' };
    if (margin >= 10) return { rating: 'average', emoji: '🟠', label: 'Average' };
    if (margin >= 0) return { rating: 'low', emoji: '🔴', label: 'Low' };
    return { rating: 'loss', emoji: '⛔', label: 'Loss' };
  }

  /**
   * Compare profitability across multiple countries
   */
  static async compareCountries(params, countryCodes) {
    const results = {};
    for (const code of countryCodes) {
      results[code] = await this.calculate({ ...params, countryCode: code });
    }
    return results;
  }

  static round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}

module.exports = ProfitCalculator;
