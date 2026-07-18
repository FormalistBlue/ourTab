import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { getDb } from './client'

export function migrateDatabase() {
  const migrationsFolder = resolve(process.cwd(), 'drizzle')
  if (!existsSync(migrationsFolder)) {
    throw new Error(`Missing database migrations at ${migrationsFolder}`)
  }
  migrate(getDb(), { migrationsFolder })
}
