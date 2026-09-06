CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`feature` text NOT NULL,
	`product` text NOT NULL,
	`fingerprint` text NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`device_details` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_votes_fingerprint_feature` ON `votes` (`fingerprint`,`feature`);--> statement-breakpoint
CREATE INDEX `idx_votes_feature_product` ON `votes` (`feature`,`product`);