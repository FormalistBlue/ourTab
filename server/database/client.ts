import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { initialSchemaSql } from './migrations/0000_initial'
import * as schema from './schema'

export type OurTabDatabase = BetterSQLite3Database<typeof schema>
let singleton: OurTabDatabase | null = null

export function createDatabase(source = process.env.DATABASE_PATH || './data/ourtab.db') {
  if (source !== ':memory:') mkdirSync(dirname(source), { recursive: true })
  const sqlite = new Database(source)
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(initialSchemaSql)
  return { sqlite, db: drizzle(sqlite, { schema }) }
}

export function getDatabase(): OurTabDatabase {
  if (!singleton) singleton = createDatabase().db
  return singleton
}
