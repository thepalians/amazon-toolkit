# 📝 Changelog

All notable changes to Amazon Seller Toolkit will be documented in this file.

---

## [v3.4.0] - 2026-03-03
### Phase 3: Multi-user Teams + Webhook Integrations
- Teams: Create teams, invite members by email
- Role-based access: Owner, Admin, Editor, Viewer
- Accept/decline invitations
- Team member management
- Webhooks: Slack, Discord, MS Teams, Custom URL
- Platform-specific payload formatting
- Event filtering: price alerts, inventory, AB tests
- Test webhook with one click
- Webhook delivery logs with status tracking
- Toggle active/inactive per webhook

---

## [v3.2.0] - 2026-03-03
### Phase 3: A/B Test Manager + Financial Reports
- A/B Test Manager: test titles, images, bullets, prices
- Statistical significance calculator (Z-test)
- Auto-detects winner with confidence percentage
- Variant comparison cards with CTR and conversion rates
- Financial Reports: P&L tracking
- Monthly P&L chart (revenue vs expenses vs profit)
- Record types: revenue, expense, refund, ad spend, FBA, COGS
- Yearly and monthly filtering
- Profit margin calculation
- Bulk record import support
- Export both tools as CSV/PDF

---

## [v3.0.0] - 2026-03-03
### Phase 3: PPC Campaign Manager
- New tool: Amazon PPC Campaign Manager
- Create and manage Sponsored Products/Brands/Display campaigns
- Keyword-level tracking: impressions, clicks, spend, sales, orders
- Auto-calculated metrics: ACoS, ROAS, CPC, CTR, conversion rate
- AI Optimizer: bid adjustment suggestions based on performance
- Budget recommendations and scaling suggestions
- Campaign summary dashboard with charts
- 3-tab interface: Campaigns, Keywords, Optimizer
- Export campaign data as CSV/PDF

---

## [v2.5.0] - 2026-03-03
### Phase 2: Supplier Database (PHASE 2 COMPLETE)
- New tool: Supplier Database Manager
- Add suppliers with full contact details
- Platform tags: Alibaba, IndiaMart, 1688, TradeIndia, etc.
- Country and city tracking
- MOQ, lead time, payment terms, rating
- Product category tagging
- Search, filter by country/platform, sort by rating/name/lead time
- Card-based supplier display
- Edit and delete suppliers
- Export supplier data as CSV/PDF

### PHASE 2 COMPLETE — 5 New Features Added
1. Dashboard Analytics (charts + activity)
2. Email Notifications (SMTP + templates)
3. Review Analyzer (sentiment + themes)
4. Inventory Forecasting (stock prediction)
5. Supplier Database (contact management)

---

## [v2.4.0] - 2026-03-03
### 📦 Phase 2: Inventory Forecasting
- New tool: Inventory Forecasting & Stock Management
- Add products with stock levels, daily sales, lead times
- Auto-calculates: days remaining, stockout date, reorder point
- Safety stock and suggested reorder quantity
- Status tracking: Healthy, Low Stock, Reorder Now, Out of Stock
- Stock days chart (bar chart)
- Restock functionality with inventory logs
- Revenue and cost forecasting (30/60/90 days)
- Inventory value summary
- Export inventory data as CSV/PDF
- Full CRUD: Add, Update, Restock, Delete

---

## [v2.3.0] - 2026-03-03
### ⭐ Phase 2: Review Analyzer
- New tool: Amazon Review Analyzer
- Scrapes product reviews (up to 3 pages)
- Sentiment analysis: Positive/Negative/Neutral
- Rating distribution bar chart
- Sentiment pie chart
- Theme extraction: Build Quality, Value, Ease of Use, etc.
- Top keyword frequency analysis
- Strengths & Weaknesses identification
- Individual review table with sentiment tags
- Export reviews as CSV/PDF
- Multi-marketplace support

---

## [v2.2.0] - 2026-03-03
### 📧 Phase 2: Email Notifications
- Email notification service (Nodemailer + SMTP)
- Beautiful HTML email templates:
  - Price Alert emails with product details
  - Welcome email with all tools listed
- Auto-sends email when price alert triggers
- Email toggle per alert (notify_email flag)
- Gmail SMTP support (App Password)
- Graceful fallback: logs to console when disabled
- EMAIL_ENABLED=false by default (safe)
- Alert checker upgraded with email hook

---

## [v2.1.0] - 2026-03-03
### 📊 Phase 2: Dashboard Analytics
- Upgraded Dashboard with real-time analytics
- Stats cards: Tracked ASINs, Price Checks, Active Alerts, Triggered, Unread
- Interactive price trends chart (Recharts LineChart)
- Recent activity feed (notifications + price checks)
- Quick access tools grid (all 8 tools)
- Backend API: /api/dashboard/stats, /price-trends, /recent-activity
- Responsive layout with chart + activity sidebar

---

## [v2.0.0] - 2026-03-03
### 📊 Sales Estimator BSR + Phase 1 Complete!
- New tool: Sales Estimator from Amazon BSR rank
- Category-specific estimation curves (20+ categories)
- Multi-marketplace: US, IN, UK, AE with local data
- Seasonal sales adjustment by month
- Sales velocity rating (Low → Very High)
- Competition level analysis
- Revenue projections (monthly + yearly)
- Bulk mode: estimate up to 20 products at once
- Export results as CSV/PDF
- Formula transparency: shows calculation used

### 🎉 PHASE 1 COMPLETE — All 10 Core Tools Built!
1. Product Research (ASIN lookup)
2. Keyword Research
3. Listing Optimizer
4. Competitor Monitor
5. Profit Calculator
6. Export CSV/PDF
7. Listing Quality Score
8. Price Alert System
9. FBA Fee Breakdown
10. Sales Estimator (BSR)

---

## [v1.9.0] - 2026-03-03
### 🏷️ FBA Fee Breakdown (Phase 1)
- New tool: Detailed FBA Fee Calculator
- Fee types: Referral, Fulfillment, Storage, Closing, Tax
- Size tier auto-detection by product dimensions
- Multi-country support: US, IN, UK, AE with local fee rates
- 25+ product categories with correct referral rates
- Storage period options: Standard, Peak, Long-Term
- Visual cost distribution bars
- Profit, Margin, ROI summary card
- Export fee breakdown as CSV or PDF
- Backend API: /api/fba-fees/calculate, /categories, /size-tiers

---

## [v1.8.0] - 2026-03-03
### 🔔 Price Alert System (Phase 1)
- New tool: Price Alert system with 5 alert types
  - Price Drops Below target
  - Price Goes Above target
  - Any Price Change
  - Out of Stock alert
  - Back in Stock alert
- In-app notification center with unread badge
- Alert auto-triggers on competitor price check
- Pause/Resume/Delete alerts
- Notifications tab with mark-as-read
- Export alerts & notifications as CSV/PDF
- Database: price_alerts + alert_notifications tables
- Backend API: Full CRUD + notification endpoints
- Integrated into Competitor Monitor price check flow

---

## [v1.7.0] - 2026-03-03
### 📋 Listing Quality Score (Phase 1)
- New tool: Listing Quality Score analyzer
- Scores listing across 6 sections: Title, Bullets, Description, Keywords, Images, Pricing
- Each section has detailed pass/fail checks based on Amazon A10 best practices
- Overall grade system: A+ to F with color-coded scores
- Visual progress bars per section
- Smart recommendations for improvement
- Export score report as CSV or PDF
- Added new sidebar navigation item
- Backend API: POST /api/listing-score/analyze

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
