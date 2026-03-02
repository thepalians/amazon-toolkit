-- Amazon Seller Toolkit Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS amazon_tool
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE amazon_tool;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    country_code VARCHAR(5) NOT NULL DEFAULT 'US',
    marketplace VARCHAR(20) NOT NULL DEFAULT 'amazon.com',
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    preferred_language VARCHAR(10) DEFAULT 'en',
    subscription_plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
    api_calls_remaining INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_country (country_code),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ========================================
-- COUNTRY CONFIGURATIONS TABLE
-- ========================================
CREATE TABLE country_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(5) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    marketplace_domain VARCHAR(100) NOT NULL,
    currency_code VARCHAR(5) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    sales_tax_avg DECIMAL(5,2) DEFAULT 0.00,
    fba_base_fee DECIMAL(10,2) DEFAULT 0.00,
    fba_weight_fee_per_kg DECIMAL(10,2) DEFAULT 0.00,
    fba_storage_per_cbm DECIMAL(10,2) DEFAULT 0.00,
    referral_fee_percent DECIMAL(5,2) DEFAULT 15.00,
    closing_fee DECIMAL(10,2) DEFAULT 0.00,
    language_code VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    asin VARCHAR(20),
    title VARCHAR(500),
    category VARCHAR(255),
    buy_price DECIMAL(12,2),
    sell_price DECIMAL(12,2),
    weight_kg DECIMAL(8,3),
    dimensions_cm VARCHAR(50),
    country_code VARCHAR(5) NOT NULL,
    marketplace VARCHAR(100),
    profit_amount DECIMAL(12,2),
    profit_margin DECIMAL(5,2),
    roi DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_country (user_id, country_code),
    INDEX idx_asin (asin)
) ENGINE=InnoDB;

-- ========================================
-- KEYWORDS TABLE
-- ========================================
CREATE TABLE keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    seed_keyword VARCHAR(255) NOT NULL,
    related_keyword VARCHAR(255),
    search_volume_estimate VARCHAR(50),
    competition_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    country_code VARCHAR(5) NOT NULL,
    marketplace VARCHAR(100),
    suggestion_source VARCHAR(50) DEFAULT 'amazon_autocomplete',
    trending_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_keyword (user_id, seed_keyword),
    INDEX idx_country (country_code)
) ENGINE=InnoDB;

-- ========================================
-- LISTING OPTIMIZATIONS TABLE
-- ========================================
CREATE TABLE listing_optimizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT,
    original_title VARCHAR(500),
    optimized_title VARCHAR(500),
    original_description TEXT,
    optimized_description TEXT,
    original_bullets TEXT,
    optimized_bullets TEXT,
    backend_keywords TEXT,
    optimization_score INT DEFAULT 0,
    ai_model_used VARCHAR(50) DEFAULT 'claude',
    country_code VARCHAR(5) NOT NULL,
    language_used VARCHAR(20),
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ========================================
-- COMPETITOR TRACKING TABLE
-- ========================================
CREATE TABLE competitor_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    asin VARCHAR(20) NOT NULL,
    product_title VARCHAR(500),
    competitor_name VARCHAR(255),
    country_code VARCHAR(5) NOT NULL,
    marketplace VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    check_interval_hours INT DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_asin (user_id, asin),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ========================================
-- COMPETITOR PRICE HISTORY TABLE
-- ========================================
CREATE TABLE competitor_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_id INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(5) NOT NULL,
    stock_status VARCHAR(50),
    buy_box_winner BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2),
    review_count INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tracking_id) REFERENCES competitor_tracking(id) ON DELETE CASCADE,
    INDEX idx_tracking_date (tracking_id, recorded_at)
) ENGINE=InnoDB;

-- ========================================
-- PRICE ALERTS TABLE
-- ========================================
CREATE TABLE price_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tracking_id INT NOT NULL,
    alert_type ENUM('price_drop', 'price_increase', 'out_of_stock', 'back_in_stock') NOT NULL,
    threshold_percent DECIMAL(5,2),
    threshold_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tracking_id) REFERENCES competitor_tracking(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- API USAGE LOG TABLE
-- ========================================
CREATE TABLE api_usage_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint VARCHAR(255),
    api_provider VARCHAR(50),
    tokens_used INT DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    response_time_ms INT,
    status_code INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB;

-- ========================================
-- INSERT DEFAULT COUNTRY CONFIGURATIONS
-- ========================================
INSERT INTO country_configs (
    country_code, country_name, marketplace_domain, currency_code, currency_symbol,
    vat_rate, gst_rate, sales_tax_avg, fba_base_fee, fba_weight_fee_per_kg,
    fba_storage_per_cbm, referral_fee_percent, closing_fee, language_code, timezone
) VALUES
-- United States
('US', 'United States', 'amazon.com', 'USD', '$',
 0.00, 0.00, 8.00, 3.22, 0.75,
 2.40, 15.00, 1.80, 'en', 'America/New_York'),

-- India
('IN', 'India', 'amazon.in', 'INR', '₹',
 0.00, 18.00, 0.00, 29.00, 15.00,
 450.00, 15.00, 5.00, 'hi', 'Asia/Kolkata'),

-- Saudi Arabia
('SA', 'Saudi Arabia', 'amazon.sa', 'SAR', 'ر.س',
 15.00, 0.00, 0.00, 12.00, 3.50,
 45.00, 15.00, 2.00, 'ar', 'Asia/Riyadh'),

-- United Arab Emirates
('AE', 'United Arab Emirates', 'amazon.ae', 'AED', 'د.إ',
 5.00, 0.00, 0.00, 10.00, 3.00,
 40.00, 15.00, 2.00, 'ar', 'Asia/Dubai'),

-- United Kingdom
('GB', 'United Kingdom', 'amazon.co.uk', 'GBP', '£',
 20.00, 0.00, 0.00, 2.70, 0.65,
 2.00, 15.00, 1.50, 'en', 'Europe/London'),

-- Germany
('DE', 'Germany', 'amazon.de', 'EUR', '€',
 19.00, 0.00, 0.00, 3.00, 0.70,
 2.20, 15.00, 1.50, 'de', 'Europe/Berlin'),

-- France
('FR', 'France', 'amazon.fr', 'EUR', '€',
 20.00, 0.00, 0.00, 3.00, 0.70,
 2.20, 15.00, 1.50, 'fr', 'Europe/Paris'),

-- Canada
('CA', 'Canada', 'amazon.ca', 'CAD', 'C$',
 0.00, 5.00, 7.00, 4.00, 0.85,
 2.50, 15.00, 1.80, 'en', 'America/Toronto'),

-- Japan
('JP', 'Japan', 'amazon.co.jp', 'JPY', '¥',
 10.00, 0.00, 0.00, 400.00, 90.00,
 250.00, 15.00, 80.00, 'ja', 'Asia/Tokyo'),

-- Australia
('AU', 'Australia', 'amazon.com.au', 'AUD', 'A$',
 10.00, 0.00, 0.00, 3.50, 0.80,
 2.80, 15.00, 2.00, 'en', 'Australia/Sydney'),

-- Mexico
('MX', 'Mexico', 'amazon.com.mx', 'MXN', 'MX$',
 16.00, 0.00, 0.00, 55.00, 12.00,
 40.00, 15.00, 15.00, 'es', 'America/Mexico_City'),

-- Brazil
('BR', 'Brazil', 'amazon.com.br', 'BRL', 'R$',
 0.00, 0.00, 17.00, 8.00, 2.50,
 6.00, 15.00, 3.00, 'pt', 'America/Sao_Paulo'),

-- Turkey
('TR', 'Turkey', 'amazon.com.tr', 'TRY', '₺',
 18.00, 0.00, 0.00, 25.00, 8.00,
 35.00, 15.00, 5.00, 'tr', 'Europe/Istanbul'),

-- Singapore
('SG', 'Singapore', 'amazon.sg', 'SGD', 'S$',
 8.00, 0.00, 0.00, 4.00, 1.00,
 3.50, 15.00, 2.00, 'en', 'Asia/Singapore'),

-- Egypt
('EG', 'Egypt', 'amazon.eg', 'EGP', 'E£',
 14.00, 0.00, 0.00, 30.00, 10.00,
 50.00, 15.00, 5.00, 'ar', 'Africa/Cairo');
