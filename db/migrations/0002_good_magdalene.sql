ALTER TABLE `ads` ADD `ad_delivery_start_time` text;--> statement-breakpoint
ALTER TABLE `ads` ADD `days_running` integer;--> statement-breakpoint
ALTER TABLE `ads` ADD `ad_format` text;--> statement-breakpoint
ALTER TABLE `ads` ADD `deconstruction` text;--> statement-breakpoint
ALTER TABLE `sora_prompts` ADD `source_ad_id` integer REFERENCES ads(id);