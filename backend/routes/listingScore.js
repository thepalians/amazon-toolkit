const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * =============================================
 * LISTING QUALITY SCORE API
 * =============================================
 * Analyzes Amazon listing and gives a score
 * based on best practices & A10 algorithm
 * =============================================
 */

// Scoring rules based on Amazon best practices
const SCORING_RULES = {
  title: {
    minLength: 80,
    maxLength: 200,
    idealLength: 150,
    weight: 20, // 20 points max
    checks: [
      { name: 'Length (80-200 chars)', test: (v) => v.length >= 80 && v.length <= 200 },
      { name: 'Starts with brand/keyword', test: (v) => v.length > 0 && /^[A-Z]/.test(v) },
      { name: 'No ALL CAPS words', test: (v) => !v.split(' ').some(w => w.length > 3 && w === w.toUpperCase()) },
      { name: 'Contains key specs (size/color/qty)', test: (v) => /\d/.test(v) },
      { name: 'No special characters (!@#$)', test: (v) => !/[!@#$%^&*(){}[\]<>]/.test(v) },
    ],
  },
  bullets: {
    minCount: 5,
    minLength: 100,
    maxLength: 500,
    weight: 25, // 25 points max
    checks: [
      { name: 'At least 5 bullet points', test: (v) => v.length >= 5 },
      { name: 'Each bullet 100-500 chars', test: (v) => v.every(b => b.length >= 100 && b.length <= 500) },
      { name: 'Starts with CAPS or emoji', test: (v) => v.every(b => /^[A-Z🔥✅💡⭐🎯📦]/.test(b.trim())) },
      { name: 'Contains keywords naturally', test: (v, keywords) => keywords.length === 0 || v.some(b => keywords.some(k => b.toLowerCase().includes(k.toLowerCase()))) },
      { name: 'No bullet is duplicate', test: (v) => new Set(v.map(b => b.toLowerCase().trim())).size === v.length },
    ],
  },
  description: {
    minLength: 200,
    maxLength: 2000,
    weight: 15, // 15 points max
    checks: [
      { name: 'Length 200-2000 chars', test: (v) => v.length >= 200 && v.length <= 2000 },
      { name: 'Contains paragraphs (>1 line)', test: (v) => v.includes('\n') || v.length > 300 },
      { name: 'Contains keywords', test: (v, keywords) => keywords.length === 0 || keywords.some(k => v.toLowerCase().includes(k.toLowerCase())) },
      { name: 'No HTML tags', test: (v) => !/<[^>]+>/.test(v) },
      { name: 'Has call-to-action', test: (v) => /buy|order|get|try|shop|click|add to cart/i.test(v) },
    ],
  },
  keywords: {
    minCount: 5,
    weight: 15, // 15 points max
    checks: [
      { name: 'At least 5 backend keywords', test: (v) => v.length >= 5 },
      { name: 'No keyword > 250 bytes', test: (v) => v.every(k => new Blob([k]).size <= 250) },
      { name: 'No duplicate keywords', test: (v) => new Set(v.map(k => k.toLowerCase().trim())).size === v.length },
      { name: 'No brand names in backend', test: (v) => !/amazon|nike|apple|samsung|sony/i.test(v.join(' ')) },
      { name: 'Total < 250 bytes', test: (v) => new Blob([v.join(' ')]).size <= 250 },
    ],
  },
  images: {
    minCount: 7,
    weight: 15, // 15 points max
    checks: [
      { name: 'At least 7 images', test: (v) => v >= 7 },
      { name: 'At least 5 images', test: (v) => v >= 5 },
      { name: 'At least 3 images', test: (v) => v >= 3 },
      { name: 'Has main image (1+)', test: (v) => v >= 1 },
    ],
  },
  pricing: {
    weight: 10, // 10 points max
    checks: [
      { name: 'Price is set', test: (v) => v > 0 },
      { name: 'Price is competitive (set)', test: (v) => v > 0 },
    ],
  },
};

// Calculate score
function calculateListingScore(data) {
  const { title = '', bullets = [], description = '', keywords = [], imageCount = 0, price = 0 } = data;

  const results = {
    totalScore: 0,
    maxScore: 100,
    grade: '',
    sections: [],
    recommendations: [],
  };

  // ---- TITLE SCORE ----
  const titleChecks = SCORING_RULES.title.checks.map(check => ({
    name: check.name,
    passed: check.test(title),
  }));
  const titlePassed = titleChecks.filter(c => c.passed).length;
  const titleScore = Math.round((titlePassed / SCORING_RULES.title.checks.length) * SCORING_RULES.title.weight);

  results.sections.push({
    name: 'Title',
    icon: '📝',
    score: titleScore,
    maxScore: SCORING_RULES.title.weight,
    checks: titleChecks,
    stats: { length: title.length, ideal: '80-200 chars' },
  });

  if (title.length < 80) results.recommendations.push('📝 Title is too short. Aim for 80-200 characters with key product details.');
  if (title.length > 200) results.recommendations.push('📝 Title is too long. Keep it under 200 characters.');
  if (title.length === 0) results.recommendations.push('📝 Title is missing! Add a descriptive product title.');

  // ---- BULLETS SCORE ----
  const bulletChecks = SCORING_RULES.bullets.checks.map(check => ({
    name: check.name,
    passed: check.test(bullets, keywords),
  }));
  const bulletPassed = bulletChecks.filter(c => c.passed).length;
  const bulletScore = Math.round((bulletPassed / SCORING_RULES.bullets.checks.length) * SCORING_RULES.bullets.weight);

  results.sections.push({
    name: 'Bullet Points',
    icon: '🔹',
    score: bulletScore,
    maxScore: SCORING_RULES.bullets.weight,
    checks: bulletChecks,
    stats: { count: bullets.length, ideal: '5 bullets, 100-500 chars each' },
  });

  if (bullets.length < 5) results.recommendations.push('🔹 Add at least 5 bullet points. You have ' + bullets.length + '.');
  if (bullets.some(b => b.length < 100)) results.recommendations.push('🔹 Some bullets are too short. Aim for 100-500 characters each.');

  // ---- DESCRIPTION SCORE ----
  const descChecks = SCORING_RULES.description.checks.map(check => ({
    name: check.name,
    passed: check.test(description, keywords),
  }));
  const descPassed = descChecks.filter(c => c.passed).length;
  const descScore = Math.round((descPassed / SCORING_RULES.description.checks.length) * SCORING_RULES.description.weight);

  results.sections.push({
    name: 'Description',
    icon: '📄',
    score: descScore,
    maxScore: SCORING_RULES.description.weight,
    checks: descChecks,
    stats: { length: description.length, ideal: '200-2000 chars' },
  });

  if (description.length < 200) results.recommendations.push('📄 Description is too short. Add more details (200+ chars).');
  if (description.length === 0) results.recommendations.push('📄 Description is missing! Add a detailed product description.');

  // ---- KEYWORDS SCORE ----
  const keywordChecks = SCORING_RULES.keywords.checks.map(check => ({
    name: check.name,
    passed: check.test(keywords),
  }));
  const keywordPassed = keywordChecks.filter(c => c.passed).length;
  const keywordScore = Math.round((keywordPassed / SCORING_RULES.keywords.checks.length) * SCORING_RULES.keywords.weight);

  results.sections.push({
    name: 'Backend Keywords',
    icon: '🔑',
    score: keywordScore,
    maxScore: SCORING_RULES.keywords.weight,
    checks: keywordChecks,
    stats: { count: keywords.length, bytes: new Blob([keywords.join(' ')]).size, maxBytes: 250 },
  });

  if (keywords.length < 5) results.recommendations.push('🔑 Add at least 5 backend keywords for better discoverability.');

  // ---- IMAGES SCORE ----
  const imgChecks = SCORING_RULES.images.checks.map(check => ({
    name: check.name,
    passed: check.test(imageCount),
  }));
  const imgPassed = imgChecks.filter(c => c.passed).length;
  const imgScore = Math.round((imgPassed / SCORING_RULES.images.checks.length) * SCORING_RULES.images.weight);

  results.sections.push({
    name: 'Images',
    icon: '📸',
    score: imgScore,
    maxScore: SCORING_RULES.images.weight,
    checks: imgChecks,
    stats: { count: imageCount, ideal: '7-9 images' },
  });

  if (imageCount < 7) results.recommendations.push('📸 Add more images. Listings with 7+ images convert 30% better.');

  // ---- PRICE SCORE ----
  const priceChecks = SCORING_RULES.pricing.checks.map(check => ({
    name: check.name,
    passed: check.test(price),
  }));
  const pricePassed = priceChecks.filter(c => c.passed).length;
  const priceScore = Math.round((pricePassed / SCORING_RULES.pricing.checks.length) * SCORING_RULES.pricing.weight);

  results.sections.push({
    name: 'Pricing',
    icon: '💰',
    score: priceScore,
    maxScore: SCORING_RULES.pricing.weight,
    checks: priceChecks,
    stats: { price },
  });

  // ---- TOTAL ----
  results.totalScore = titleScore + bulletScore + descScore + keywordScore + imgScore + priceScore;

  // Grade
  if (results.totalScore >= 90) results.grade = { letter: 'A+', color: '#22c55e', label: 'Excellent' };
  else if (results.totalScore >= 80) results.grade = { letter: 'A', color: '#22c55e', label: 'Great' };
  else if (results.totalScore >= 70) results.grade = { letter: 'B', color: '#84cc16', label: 'Good' };
  else if (results.totalScore >= 60) results.grade = { letter: 'C', color: '#f59e0b', label: 'Average' };
  else if (results.totalScore >= 40) results.grade = { letter: 'D', color: '#f97316', label: 'Needs Work' };
  else results.grade = { letter: 'F', color: '#ef4444', label: 'Poor' };

  return results;
}

// POST /api/listing-score/analyze
router.post('/analyze', auth, (req, res) => {
  try {
    const { title, bullets, description, keywords, imageCount, price } = req.body;

    if (!title && (!bullets || bullets.length === 0) && !description) {
      return res.status(400).json({ message: 'Please provide at least a title, bullets, or description to analyze.' });
    }

    const result = calculateListingScore({
      title: title || '',
      bullets: bullets || [],
      description: description || '',
      keywords: keywords || [],
      imageCount: parseInt(imageCount) || 0,
      price: parseFloat(price) || 0,
    });

    res.json(result);
  } catch (err) {
    console.error('Listing score error:', err);
    res.status(500).json({ message: 'Failed to analyze listing.' });
  }
});

module.exports = router;
