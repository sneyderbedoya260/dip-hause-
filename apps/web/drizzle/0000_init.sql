CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`wash_id` text NOT NULL,
	`wash_name` text NOT NULL,
	`price_cop` integer NOT NULL,
	`duration_min` integer NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`vehicle` text NOT NULL,
	`plate` text NOT NULL,
	`extras` text DEFAULT '[]' NOT NULL,
	`user_id` text,
	`assigned_to` text,
	`address` text NOT NULL,
	`refs` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'por_pagar' NOT NULL,
	`mp_preference_id` text,
	`mp_payment_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_tokens_token_hash_unique` ON `auth_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_type` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`dedupe_key` text NOT NULL,
	`kind` text NOT NULL,
	`appointment_id` text,
	`user_id` text,
	`to_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sent_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_dedupe_key_unique` ON `notifications` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cop` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`audience` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`absolute_expires_at` integer NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`days` text DEFAULT '1,2,3,4,5,6' NOT NULL,
	`open_hour` integer DEFAULT 8 NOT NULL,
	`close_hour` integer DEFAULT 18 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`email_verified_at` integer,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`active` integer DEFAULT true NOT NULL,
	`totp_secret` text,
	`last_login_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `wash_extras` (
	`id` text PRIMARY KEY NOT NULL,
	`wash_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cop` integer NOT NULL,
	`duration_min` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `washes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cop` integer NOT NULL,
	`duration_min` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
