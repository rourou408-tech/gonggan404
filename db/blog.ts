let blogInitialized = false;

export async function ensureBlogTable(database: D1Database) {
  if (blogInitialized) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_key TEXT NOT NULL,
    image_type TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS blog_content_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    blog_id INTEGER NOT NULL,
    image_key TEXT NOT NULL DEFAULT '',
    image_type TEXT NOT NULL DEFAULT '',
    body_text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`).run();
  blogInitialized = true;
}

export function isBlogAdmin(request: Request, configuredKey: string | undefined) {
  return Boolean(configuredKey) && request.headers.get("x-admin-key") === configuredKey;
}
