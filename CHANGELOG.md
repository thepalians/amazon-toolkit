# 📝 Changelog

All notable changes to Amazon Seller Toolkit will be documented in this file.

---

## [v1.6.0] - 2026-03-03
### 📤 Export CSV/PDF Feature (Phase 1)
- Added universal export utility (`exportUtils.js`) for CSV & PDF generation
- Added reusable `ExportButton` dropdown component
- **Profit Calculator**: Export profit report as CSV or PDF
- **Keyword Research**: Export keyword results with volume, competition, trend scores
- **AI Listing Optimizer**: Export optimized title, bullets, description, backend keywords
- **Competitor Monitor**: Export tracked ASINs list + Price history per ASIN
- PDF exports include branded header, Amazon orange theme, page numbers
- CSV exports include UTF-8 BOM for proper Excel/Google Sheets compatibility
- Installed `jspdf`, `jspdf-autotable`, `file-saver` libraries

---

## [v1.5.0] - 2026-03-03
### 💱 Currency Conversion & PayPal Integration
- Added live currency conversion API (`/api/currency/rates`) with 1hr cache
- PayPal checkout for international users (USD)
- Razorpay for Indian users (INR) — auto-detect by country
- Smart gateway selection: INR → Razorpay, Others → PayPal
- Multi-currency price display on Pricing page

---

## [v1.4.0] - 2026-03-03
### 🤖 AI Model Fix & Language Detection
- Fixed Claude AI model (`claude-3-5-haiku` → `claude-sonnet-4-20250514`)
- Added input language detection — output matches user's input language
- Amazon A10 algorithm optimization in listing prompts
- Fixed trust proxy warning for Express rate limiter

---

## [v1.3.0] - 2026-03-03
### 🔑 Activation Key Card System
- New `activation_keys` database table
- Admin: Generate keys in batches (starter/professional)
- Admin: View, filter, export keys
- User: Activate Key page with validation
- Key format: `AST-XXXX-XXXX-XXXX`
- Generated 15 test keys (5 starter + 10 professional)

---

## [v1.2.0] - 2026-03-03
### 📄 Legal Pages & Backup
- Added Terms of Service, Privacy Policy, Refund Policy pages
- Auth page links (Login/Register)
- Sidebar footer with legal links
- Database backup script (`scripts/backup.sh`)
- Added favicon

---

## [v1.1.0] - 2026-03-03
### 💳 Razorpay & Subscription Plans
- Razorpay payment integration (INR)
- Subscription plans: Free, Basic, Premium, Pro
- Admin: Plan management (CRUD)
- Admin: License key generation
- Admin: User subscription management
- Admin: Revenue analytics dashboard
- Fixed registration/login bugs

---

## [v1.0.0] - 2026-03-03
### 🚀 Initial Release
- **Profit Calculator** — FBA fee calculation, margin analysis
- **Keyword Research** — AI-powered keyword discovery
- **AI Listing Optimizer** — Claude AI powered title/bullet/description optimization
- **Competitor Monitor** — Track competitor products
- **Pricing Page** — Subscription plans display
- **User Authentication** — Register, Login, JWT tokens
- **Admin Panel** — Dashboard, Users, Plans, Logs, Settings
- **Dark/Light Theme** — Full theme support
- **Responsive Design** — Mobile-friendly
- Multi-country support (IN, US, UK, UAE, etc.)
