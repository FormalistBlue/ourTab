import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let sqlite: BetterSqlite3.Database | undefined
let database: ReturnType<typeof drizzle<typeof schema>> | undefined

export function resolveRuntimePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path)
}

export function getSqlite() {
  if (sqlite) return sqlite

  const runtimeConfig = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
  const databasePath = resolveRuntimePath(runtimeConfig?.databasePath || process.env.NUXT_DATABASE_PATH || './data/ourtab.db')
  mkdirSync(dirname(databasePath), { recursive: true })
  sqlite = new BetterSqlite3(databasePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('busy_timeout = 5000')
  return sqlite
}

export function getDb() {
  if (!database) {
    database = drizzle(getSqlite(), { schema })
  }
  return database
}

export type AppDatabase = ReturnType<typeof getDb>

export function withTransaction<T>(callback: () => T) {
  return getSqlite().transaction(callback)()
}
