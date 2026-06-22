import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { initialSchemaSql } from './migrations/0000_initial'
import * as schema from './schema'

export type OurTabDatabase = BetterSQLite3Database<typeof schema>
let singleton: OurTabDatabase | null = null

function runMigrations(sqlite: Database.Database) {
  // Check if icon_color column exists, add if not
  const columns = sqlite.prepare("PRAGMA table_info(tabs)").all() as { name: string }[]
  const columnNames = columns.map((c) => c.name)

  if (!columnNames.includes('icon_color')) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN icon_color TEXT")
  }
  if (!columnNames.includes('icon_background_color')) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN icon_background_color TEXT")
  }
}

export function createDatabase(source = process.env.DATABASE_PATH || './data/ourtab.db') {
  if (source !== ':memory:') mkdirSync(dirname(source), { recursive: true })
  const sqlite = new Database(source)
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(initialSchemaSql)
  runMigrations(sqlite)
  return { sqlite, db: drizzle(sqlite, { schema }) }
}

export function getDatabase(): OurTabDatabase {
  if (!singleton) singleton = createDatabase().db
  return singleton
}
