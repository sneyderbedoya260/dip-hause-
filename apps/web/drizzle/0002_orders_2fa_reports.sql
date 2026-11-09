CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`price_cop` integer NOT NULL,
	`qty` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`user_id` text,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`delivery` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`total_cop` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'por_pagar' NOT NULL,
	`paid_at` integer,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`mp_preference_id` text,
	`mp_payment_id` text,
	`privacy_accepted_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `paid_at` integer;--> statement-breakpoint
ALTER TABLE `appointments` ADD `privacy_accepted_at` integer;--> statement-breakpoint
ALTER TABLE `appointments` ADD `evidence_purged` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_tokens` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `evidence_retention_days` integer DEFAULT 365 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_last_step` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `recovery_hashes` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `privacy_accepted_at` integer;