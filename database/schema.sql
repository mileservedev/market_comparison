CREATE TABLE IF NOT EXISTS votes (
  id CHAR(36) NOT NULL,
  campaign VARCHAR(64) NOT NULL DEFAULT 'running-shoes',
  feature VARCHAR(64) NOT NULL,
  product VARCHAR(64) NOT NULL,
  visitor_key CHAR(64) NOT NULL,
  user_agent VARCHAR(512) NOT NULL,
  device_details JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_votes_campaign_visitor_feature (campaign, visitor_key, feature),
  KEY idx_votes_campaign_feature_product (campaign, feature, product),
  KEY idx_votes_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
