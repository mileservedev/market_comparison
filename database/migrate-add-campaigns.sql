ALTER TABLE votes
  ADD COLUMN campaign VARCHAR(64) NOT NULL DEFAULT 'running-shoes' AFTER id,
  DROP INDEX uq_votes_visitor_feature,
  ADD UNIQUE KEY uq_votes_campaign_visitor_feature (campaign, visitor_key, feature),
  ADD KEY idx_votes_campaign_feature_product (campaign, feature, product);
