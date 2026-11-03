CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`original_name` text DEFAULT '' NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
