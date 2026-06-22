export const initialSchemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tabs (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  icon_type TEXT NOT NULL DEFAULT 'auto',
  icon_color TEXT,
  icon_background_color TEXT,
  is_folder INTEGER NOT NULL DEFAULT 0,
  folder_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES tabs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`
