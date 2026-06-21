import { eq } from 'drizzle-orm'
import { defaultSettings } from '../../app/constants/defaults'
import type { AppSettings } from '../../app/types/ourtab'
import type { OurTabDatabase } from '../database/client'
import { settings } from '../database/schema'

function now() { return new Date().toISOString() }
export function getSettings(db: OurTabDatabase): AppSettings {
  const result = structuredClone(defaultSettings)
  for (const row of db.select().from(settings).all()) Object.assign(result, { [row.key]: JSON.parse(row.value) })
  return result
}
export function updateSetting<K extends keyof AppSettings>(db: OurTabDatabase, key: K, value: AppSettings[K]) {
  db.insert(settings).values({ key, value: JSON.stringify(value), updatedAt: now() }).onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value), updatedAt: now() } }).run()
  return getSettings(db)[key]
}
export function deleteSetting(db: OurTabDatabase, key: keyof AppSettings) { db.delete(settings).where(eq(settings.key, key)).run() }
