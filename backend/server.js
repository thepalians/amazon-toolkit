/**
 * =============================================
 * AMAZON SELLER TOOLKIT - EXPRESS SERVER
 * =============================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');

dotenv.config();

const app = express();

// ---- Security ----
app.use(helmet());

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ---- Body Parser ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ---- Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/profit', require('./routes/profit'));
app.use('/api/keywords', require('./routes/keywords'));
app.use('/api/listing', require('./routes/listing'));
app.use('/api/competitor', require('./routes/competitor'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/payments', require('./routes/payments'));

// ---- Country config endpoint (public) ----
const { getAllCountries } = require('./services/countryConfig');
app.get('/api/countries', (req, res) => {
  res.json({ success: true, countries: getAllCountries() });
});

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Amazon Seller Toolkit API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
