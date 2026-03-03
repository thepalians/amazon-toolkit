const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * =============================================
 * REVIEW ANALYZER API
 * =============================================
 * Scrapes Amazon reviews and provides:
 * - Sentiment analysis (positive/negative/neutral)
 * - Common themes extraction
 * - Rating distribution
 * - Keyword frequency in reviews
 * - Strengths & weaknesses summary
 * =============================================
 */

// Positive & Negative keyword sets
const POSITIVE_WORDS = new Set([
  'great', 'excellent', 'amazing', 'perfect', 'love', 'loved', 'awesome', 'best',
  'good', 'wonderful', 'fantastic', 'beautiful', 'happy', 'pleased', 'impressed',
  'recommend', 'recommended', 'outstanding', 'quality', 'sturdy', 'durable',
  'comfortable', 'fast', 'easy', 'nice', 'solid', 'worth', 'reliable', 'super',
  'brilliant', 'superior', 'incredible', 'smooth', 'premium', 'exceptional',
  // Hindi/Urdu common
  'accha', 'badhiya', 'zabardast', 'shandar', 'behtareen', 'kamaal',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'broke',
  'broken', 'waste', 'cheap', 'disappointed', 'disappointing', 'useless',
  'defective', 'flimsy', 'garbage', 'junk', 'return', 'returned', 'refund',
  'scam', 'fake', 'fragile', 'slow', 'difficult', 'uncomfortable', 'overpriced',
  'leaking', 'damaged', 'missing', 'wrong', 'fails', 'failed', 'malfunction',
  'regret', 'complained', 'unreliable', 'stopped', 'doesn\'t work',
  // Hindi/Urdu common
  'kharab', 'bekar', 'ghatiya', 'bakwas', 'wahiyat',
]);

// Theme categories
const THEME_KEYWORDS = {
  'Build Quality': ['quality', 'build', 'material', 'sturdy', 'durable', 'flimsy', 'cheap', 'solid', 'premium', 'plastic'],
  'Value for Money': ['price', 'value', 'worth', 'expensive', 'cheap', 'overpriced', 'affordable', 'money', 'cost', 'budget'],
  'Ease of Use': ['easy', 'simple', 'difficult', 'complicated', 'intuitive', 'setup', 'install', 'user-friendly', 'confusing'],
  'Delivery & Packaging': ['delivery', 'shipping', 'package', 'packaging', 'arrived', 'box', 'damaged', 'fast delivery', 'late'],
  'Customer Service': ['service', 'support', 'response', 'replacement', 'refund', 'return', 'warranty', 'customer care'],
  'Performance': ['performance', 'fast', 'slow', 'speed', 'battery', 'power', 'efficient', 'works', 'doesn\'t work'],
  'Design & Look': ['design', 'look', 'color', 'colour', 'beautiful', 'ugly', 'style', 'aesthetic', 'sleek', 'compact'],
  'Size & Fit': ['size', 'fit', 'big', 'small', 'large', 'tight', 'loose', 'perfect fit', 'too small', 'too big'],
  'Comfort': ['comfortable', 'comfort', 'soft', 'hard', 'uncomfortable', 'cushion', 'ergonomic'],
};

function analyzeSentiment(text) {
  const words = text.toLowerCase().split(/\s+/);
  let positive = 0, negative = 0;
  words.forEach(w => {
    const clean = w.replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.has(clean)) positive++;
    if (NEGATIVE_WORDS.has(clean)) negative++;
  });
  const total = positive + negative;
  if (total === 0) return { sentiment: 'neutral', score: 0.5, positive, negative };
  const score = positive / total;
  let sentiment = 'neutral';
  if (score >= 0.65) sentiment = 'positive';
  else if (score <= 0.35) sentiment = 'negative';
  return { sentiment, score: Math.round(score * 100) / 100, positive, negative };
}

function extractThemes(reviews) {
  const themeCounts = {};
  const themeSentiments = {};

  Object.keys(THEME_KEYWORDS).forEach(theme => {
    themeCounts[theme] = 0;
    themeSentiments[theme] = { positive: 0, negative: 0 };
  });

  reviews.forEach(review => {
    const text = review.text.toLowerCase();
    Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
      const found = keywords.some(kw => text.includes(kw));
      if (found) {
        themeCounts[theme]++;
        if (review.sentiment === 'positive') themeSentiments[theme].positive++;
        else if (review.sentiment === 'negative') themeSentiments[theme].negative++;
      }
    });
  });

  return Object.entries(themeCounts)
    .filter(([_, count]) => count > 0)
    .map(([theme, count]) => ({
      theme,
      mentions: count,
      percentage: Math.round((count / reviews.length) * 100),
      sentiment: themeSentiments[theme],
    }))
    .sort((a, b) => b.mentions - a.mentions);
}

function extractKeywords(reviews, topN = 20) {
  const freq = {};
  const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'was', 'for', 'and', 'of', 'to', 'in', 'on', 'with', 'this', 'that', 'i', 'my', 'but', 'not', 'so', 'very', 'had', 'has', 'have', 'are', 'been', 'its', 'from', 'be', 'at', 'or', 'as', 'one', 'all', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'can', 'will', 'do', 'if', 'just', 'than', 'them', 'also', 'other', 'could', 'our', 'into', 'up', 'no', 'out', 'more', 'some', 'after', 'you', 'me', 'he', 'she', 'we', 'they', 'your', 'his', 'her']);

  reviews.forEach(r => {
    const words = r.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
  });

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

async function scrapeReviews(asin, countryConfig, maxPages = 3) {
  const marketplace = countryConfig.marketplaceUrl || 'https://www.amazon.com';
  const reviews = [];
  const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': countryConfig.locale || 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  let productTitle = '';

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${marketplace}/product-reviews/${asin}?pageNumber=${page}&sortBy=recent`;
      const response = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);

      if (!productTitle) {
        productTitle = $('a[data-hook="product-link"]').text().trim() || '';
      }

      $('[data-hook="review"]').each((_, el) => {
        const title = $(el).find('[data-hook="review-title"] span:last').text().trim();
        const text = $(el).find('[data-hook="review-body"] span').first().text().trim();
        const ratingText = $(el).find('[data-hook="review-star-rating"] span.a-icon-alt, [data-hook="cmps-review-star-rating"] span.a-icon-alt').first().text().trim();
        const rating = parseFloat(ratingText) || 0;
        const date = $(el).find('[data-hook="review-date"]').text().trim();
        const helpful = $(el).find('[data-hook="helpful-vote-statement"]').text().trim();
        const verified = $(el).find('[data-hook="avp-badge"]').length > 0;

        if (text) {
          const { sentiment, score, positive, negative } = analyzeSentiment(title + ' ' + text);
          const stars = Math.round(rating);
          if (stars >= 1 && stars <= 5) ratingDist[stars]++;

          reviews.push({
            title, text, rating: stars, date, helpful, verified,
            sentiment, sentimentScore: score,
            positiveWords: positive, negativeWords: negative,
          });
        }
      });

      // Rate limiting
      if (page < maxPages) await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Review scrape page ${page} failed:`, err.message);
    }
  }

  return { reviews, ratingDist, productTitle };
}

// POST /api/reviews/analyze
router.post('/analyze', auth, async (req, res) => {
  try {
    const { asin, countryCode, maxPages } = req.body;

    if (!asin) {
      return res.status(400).json({ success: false, message: 'ASIN is required.' });
    }

    // Get country config
    const { getCountryConfig } = require('../config/countries');
    const countryConfig = getCountryConfig ? getCountryConfig(countryCode || 'US') : {
      marketplaceUrl: 'https://www.amazon.com', locale: 'en-US',
    };

    const { reviews, ratingDist, productTitle } = await scrapeReviews(asin, countryConfig, maxPages || 3);

    if (reviews.length === 0) {
      return res.json({
        success: true,
        asin,
        message: 'No reviews found or unable to scrape.',
        totalReviews: 0,
      });
    }

    // Overall stats
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    reviews.forEach(r => sentimentCounts[r.sentiment]++);

    // Themes
    const themes = extractThemes(reviews);

    // Top keywords
    const topKeywords = extractKeywords(reviews);

    // Strengths & Weaknesses
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive');
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');

    const strengths = extractKeywords(positiveReviews, 10).map(k => k.word);
    const weaknesses = extractKeywords(negativeReviews, 10).map(k => k.word);

    res.json({
      success: true,
      asin,
      productTitle,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingDistribution: ratingDist,
      sentiment: {
        positive: sentimentCounts.positive,
        negative: sentimentCounts.negative,
        neutral: sentimentCounts.neutral,
        positivePercent: Math.round((sentimentCounts.positive / totalReviews) * 100),
        negativePercent: Math.round((sentimentCounts.negative / totalReviews) * 100),
        neutralPercent: Math.round((sentimentCounts.neutral / totalReviews) * 100),
      },
      themes,
      topKeywords,
      strengths,
      weaknesses,
      reviews: reviews.slice(0, 20),
    });
  } catch (err) {
    console.error('Review analysis error:', err);
    res.status(500).json({ success: false, message: 'Review analysis failed.' });
  }
});

module.exports = router;
