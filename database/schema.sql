CREATE TABLE IF NOT EXISTS votes (
  id CHAR(36) NOT NULL,
  feature VARCHAR(64) NOT NULL,
  product VARCHAR(64) NOT NULL,
  visitor_key CHAR(64) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(512) NOT NULL,
  device_details JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_votes_visitor_feature (visitor_key, feature),
  KEY idx_votes_feature_product (feature, product)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
