import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const visitorMessages = sqliteTable("visitor_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  avatar: text("avatar").notNull(),
  likes: integer("likes").notNull().default(0),
  status: text("status").notNull().default("pending"),
  isPinned: integer("is_pinned").notNull().default(0),
  createdAt: text("created_at").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  ipHash: text("ip_hash"),
  deviceInfo: text("device_info"),
});

export const messageLikes = sqliteTable("message_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: integer("message_id").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageKey: text("image_key").notNull(),
  imageType: text("image_type").notNull(),
  createdAt: text("created_at").notNull(),
});

export const blogContentBlocks = sqliteTable("blog_content_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  blogId: integer("blog_id").notNull(),
  imageKey: text("image_key").notNull().default(""),
  imageType: text("image_type").notNull().default(""),
  bodyText: text("body_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const selectedWorks = sqliteTable("selected_works", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageKey: text("image_key").notNull().default(""),
  imageType: text("image_type").notNull().default(""),
  visualKey: text("visual_key").notNull().default("custom"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const workContentBlocks = sqliteTable("work_content_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workId: integer("work_id").notNull(),
  imageKey: text("image_key").notNull(),
  imageType: text("image_type").notNull(),
  bodyText: text("body_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});
