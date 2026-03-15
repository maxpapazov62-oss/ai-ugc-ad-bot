import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  monthlyTraffic: integer("monthly_traffic"),
  threeMonthGrowth: real("three_month_growth"),
  metaAdCount: integer("meta_ad_count"),
  niche: text("niche"),
  facebookPageId: text("facebook_page_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const ads = sqliteTable("ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  metaAdId: text("meta_ad_id").unique(),
  hook: text("hook"),
  bodyText: text("body_text"),
  ctaText: text("cta_text"),
  angle: text("angle"),
  creativeType: text("creative_type"),
  thumbnailUrl: text("thumbnail_url"),
  rawPayload: text("raw_payload"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => [
  index("ads_brand_id_idx").on(table.brandId),
]);

export const swipeFiles = sqliteTable("swipe_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  brandIds: text("brand_ids").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const soraPrompts = sqliteTable("sora_prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  swipeFileId: integer("swipe_file_id").references(() => swipeFiles.id),
  brandId: integer("brand_id").references(() => brands.id),
  label: text("label").notNull(),
  duration: integer("duration").notNull(),
  shotNumber: integer("shot_number"),
  promptText: text("prompt_text").notNull(),
  angle: text("angle"),
  status: text("status").notNull().default("pending"),
  soraSharedLink: text("sora_shared_link"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => [
  index("sora_prompts_brand_id_idx").on(table.brandId),
  index("sora_prompts_status_idx").on(table.status),
]);

export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  promptId: integer("prompt_id").references(() => soraPrompts.id),
  soraSharedLink: text("sora_shared_link"),
  watermarkStatus: text("watermark_status").notNull().default("pending"),
  localFilePath: text("local_file_path"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => [
  index("videos_prompt_id_idx").on(table.promptId),
]);
