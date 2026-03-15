CREATE INDEX `ads_brand_id_idx` ON `ads` (`brand_id`);--> statement-breakpoint
CREATE INDEX `sora_prompts_brand_id_idx` ON `sora_prompts` (`brand_id`);--> statement-breakpoint
CREATE INDEX `sora_prompts_status_idx` ON `sora_prompts` (`status`);--> statement-breakpoint
CREATE INDEX `videos_prompt_id_idx` ON `videos` (`prompt_id`);