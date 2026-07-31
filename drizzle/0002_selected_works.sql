CREATE TABLE IF NOT EXISTS selected_works (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_key TEXT NOT NULL DEFAULT '',
  image_type TEXT NOT NULL DEFAULT '',
  visual_key TEXT NOT NULL DEFAULT 'custom',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
