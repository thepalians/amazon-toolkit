# 🛒 Amazon Seller Toolkit

> All-in-one SaaS platform for Amazon sellers — Profit Calculator, Keyword Research, AI Listing Optimizer, Competitor Monitor, and more.

**Live:** [https://palians.com/amazon-seller-toolkit](https://palians.com/amazon-seller-toolkit)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Payment Integration](#-payment-integration)
- [Activation Key System](#-activation-key-system)
- [API Endpoints](#-api-endpoints)
- [Changelog](#-changelog)

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 📊 **Profit Calculator** | Calculate Amazon FBA/FBM profit margins with fees | ✅ Live |
| 🔍 **Keyword Research** | Find high-volume, low-competition keywords | ✅ Live |
| ✍️ **AI Listing Optimizer** | Claude AI-powered listing optimization (A10 algorithm) | ✅ Live |
| 📈 **Competitor Monitor** | Track competitor ASINs, prices, and rankings | ✅ Live |
| 💳 **Razorpay Payments** | INR payments for Indian users (UPI, Cards, NetBanking) | ✅ Live |
| 💰 **PayPal Payments** | USD payments for international users | ✅ Live |
| 🔑 **Activation Key Cards** | Physical key cards sold on Amazon.in/Amazon.com | ✅ Live |
| 💱 **Multi-Currency** | Auto-detect country, live INR↔USD conversion | ✅ Live |
| 🌙 **Dark/Light Theme** | User-selectable theme | ✅ Live |
| 👨‍💼 **Admin Panel** | Full admin dashboard with user/plan/key/revenue management | ✅ Live |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Axios, CSS Variables |
| **Backend** | Node.js, Express.js, Sequelize ORM |
| **Database** | MySQL 8 |
| **AI** | Anthropic Claude (claude-sonnet-4-20250514) |
| **Payments** | Razorpay (India), PayPal (International) |
| **Server** | Ubuntu, Nginx reverse proxy, PM2 process manager |
| **Domain** | palians.com (Cloudflare DNS) |

---

## 📁 Project Structure

```
amazon-seller-toolkit/
├── backend/
│   ├── middleware/       # Auth, rate limiting
│   ├── models/           # Sequelize models (User, Plan, Payment, etc.)
│   ├── routes/           # API routes (admin, auth, payments, listing, etc.)
│   ├── services/         # Business logic (listingOptimizer, etc.)
│   ├── server.js         # Express app entry point
│   └── .env              # Environment variables (not in repo)
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Admin/    # Admin panel components
│   │   │   ├── Subscription/ # Pricing, activation pages
│   │   │   └── ...       # Dashboard, tools, etc.
│   │   ├── App.js        # Main router
│   │   └── index.js      # Entry point
│   └── public/
├── nginx/                # Nginx configuration
├── README.md
├── CHANGELOG.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8
- PM2 (process manager)
- Nginx (reverse proxy)

### Installation

```bash
# Clone
git clone https://github.com/thepalians/amazon-toolkit.git
cd amazon-toolkit

# Backend setup
cd backend
npm install
cp .env.example .env  # Edit with your credentials
npm start

# Frontend setup
cd ../frontend
npm install
npm run build
```

---

## 🔐 Environment Variables

Create `backend/.env` with:

```env
# Server
NODE_ENV=production
PORT=5000

# Database (MySQL 8)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=amazon_tool
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret

# Claude AI
CLAUDE_API_KEY=sk-ant-api03-xxxxx

# Razorpay (India Payments)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# PayPal (International Payments)
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=live

# CORS
CORS_ORIGINS=https://yourdomain.com,http://localhost:3000
```

---

## 💳 Payment Integration

| Gateway | Region | Currency | Method |
|---------|--------|----------|--------|
| **Razorpay** | India | INR | UPI, Cards, NetBanking, Wallets |
| **PayPal** | International | USD | PayPal Balance, Cards, Bank |

- Auto-detection: User's selected country determines gateway
- India (IN) → Razorpay | Others → PayPal
- Live currency conversion via free exchange rate API

---

## 🔑 Activation Key System

Physical key cards sold on Amazon marketplace:

- **Format:** `AST-XXXX-XXXX-XXXX`
- **Plans:** Starter (1 month), Professional (12 months)
- **Flow:** Purchase card → Scratch code → Enter on website → Plan activates
- **Admin:** Generate keys in bulk from admin panel

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/payments/razorpay/create-order` | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Verify Razorpay payment |
| POST | `/api/payments/paypal/create-order` | Create PayPal order |
| POST | `/api/payments/paypal/capture` | Capture PayPal payment |
| POST | `/api/activate` | Activate subscription key |
| POST | `/api/listing/optimize` | AI listing optimization |
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/keys` | List activation keys |
| POST | `/api/admin/keys/generate` | Generate activation keys |
| GET | `/api/currency/rates` | Live exchange rates |

---

## 📄 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## 👨‍💻 Author

**Palians** — [palians.com](https://palians.com)

---

## 📜 License

Proprietary — All rights reserved © 2026 Palians
