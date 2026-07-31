let initialized = false;

export async function ensureMessageTables(database: D1Database) {
  if (initialized) return;
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS visitor_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      content TEXT NOT NULL,
      avatar TEXT NOT NULL,
      likes INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      is_pinned INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      ip_hash TEXT,
      device_info TEXT
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS message_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      message_id INTEGER NOT NULL,
      visitor_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS message_likes_unique_visitor ON message_likes (message_id, visitor_hash)"),
  ]);
  initialized = true;
}
