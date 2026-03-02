/**
 * AUTH ROUTES
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/profile
 * PUT  /api/auth/profile
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { DEFAULT_COUNTRY_CONFIGS } = require('../services/countryConfig');

// ---- Register ----
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, countryCode = 'US' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const config = DEFAULT_COUNTRY_CONFIGS[countryCode.toUpperCase()] || DEFAULT_COUNTRY_CONFIGS.US;
    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashed,
      full_name: fullName || '',
      country_code: countryCode.toUpperCase(),
      marketplace: config.marketplace,
      currency: config.currency,
      preferred_language: config.language,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        countryCode: user.country_code,
        marketplace: user.marketplace,
        currency: user.currency,
        language: user.preferred_language,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ---- Login ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        countryCode: user.country_code,
        marketplace: user.marketplace,
        currency: user.currency,
        language: user.preferred_language,
        subscriptionPlan: user.subscription_plan,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ---- Get Profile ----
router.get('/profile', authMiddleware, async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      countryCode: u.country_code,
      marketplace: u.marketplace,
      currency: u.currency,
      language: u.preferred_language,
      subscriptionPlan: u.subscription_plan,
      apiCallsRemaining: u.api_calls_remaining,
    },
  });
});

// ---- Update Profile ----
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, countryCode } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.full_name = fullName;

    if (countryCode) {
      const code = countryCode.toUpperCase();
      const config = DEFAULT_COUNTRY_CONFIGS[code] || DEFAULT_COUNTRY_CONFIGS.US;
      updates.country_code = code;
      updates.marketplace = config.marketplace;
      updates.currency = config.currency;
      updates.preferred_language = config.language;
    }

    await req.user.update(updates);

    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
