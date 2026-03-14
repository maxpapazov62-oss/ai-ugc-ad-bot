CREATE TABLE `ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`meta_ad_id` text,
	`hook` text,
	`body_text` text,
	`cta_text` text,
	`angle` text,
	`creative_type` text,
	`thumbnail_url` text,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ads_meta_ad_id_unique` ON `ads` (`meta_ad_id`);--> statement-breakpoint
CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`monthly_traffic` integer,
	`three_month_growth` real,
	`meta_ad_count` integer,
	`niche` text,
	`facebook_page_id` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_domain_unique` ON `brands` (`domain`);--> statement-breakpoint
CREATE TABLE `sora_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`swipe_file_id` integer,
	`brand_id` integer,
	`label` text NOT NULL,
	`duration` integer NOT NULL,
	`shot_number` integer,
	`prompt_text` text NOT NULL,
	`angle` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sora_shared_link` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`swipe_file_id`) REFERENCES `swipe_files`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `swipe_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`brand_ids` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt_id` integer,
	`sora_shared_link` text,
	`watermark_status` text DEFAULT 'pending' NOT NULL,
	`local_file_path` text,
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`prompt_id`) REFERENCES `sora_prompts`(`id`) ON UPDATE no action ON DELETE no action
);
