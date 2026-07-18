import { eq, sql } from 'drizzle-orm'
import { appState } from '../database/schema'
import type { AppDatabase } from '../database/client'
import { nowIso } from './ids'

export function getRevision(db: AppDatabase) {
  return db.select({ revision: appState.revision }).from(appState).where(eq(appState.id, 1)).get()?.revision ?? 0
}

export function bumpRevision(db: AppDatabase) {
  const updatedAt = nowIso()
  db.insert(appState).values({ id: 1, revision: 1, updatedAt })
    .onConflictDoUpdate({
      target: appState.id,
      set: { revision: sql`${appState.revision} + 1`, updatedAt }
    }).run()
  return getRevision(db)
}
