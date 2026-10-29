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
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_type` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cop` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`days` text DEFAULT '1,2,3,4,5,6' NOT NULL,
	`open_hour` integer DEFAULT 8 NOT NULL,
	`close_hour` integer DEFAULT 18 NOT NULL
);
--> statement-breakpoint
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
