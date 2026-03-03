CREATE TABLE IF NOT EXISTS activation_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key_code VARCHAR(20) UNIQUE NOT NULL,
  plan_type ENUM('starter', 'professional', 'enterprise') NOT NULL,
  duration_months INT NOT NULL DEFAULT 12,
  is_used TINYINT DEFAULT 0,
  used_by INT DEFAULT NULL,
  used_at DATETIME DEFAULT NULL,
  amazon_order_id VARCHAR(50) DEFAULT NULL,
  batch_id VARCHAR(20) DEFAULT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (used_by) REFERENCES users(id)
);
