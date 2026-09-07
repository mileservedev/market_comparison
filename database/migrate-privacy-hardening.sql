-- Run once only if the deployed database user cannot ALTER the table automatically.
-- The application now HMACs its visitor identifier before storing it.
ALTER TABLE votes DROP COLUMN ip_address;
ALTER TABLE votes ADD KEY idx_votes_created_at (created_at);

-- Match the default 90-day retention period.
DELETE FROM votes WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
