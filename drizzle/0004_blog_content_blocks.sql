CREATE TABLE IF NOT EXISTS `blog_content_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blog_id` integer NOT NULL,
	`image_key` text DEFAULT '' NOT NULL,
	`image_type` text DEFAULT '' NOT NULL,
	`body_text` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
