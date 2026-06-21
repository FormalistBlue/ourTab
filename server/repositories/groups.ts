import { randomUUID } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import type { CreateGroupInput, ReorderItem, UpdateGroupInput } from '../../app/types/ourtab'
import type { OurTabDatabase } from '../database/client'
import { groups } from '../database/schema'

function now() { return new Date().toISOString() }
export function listGroups(db: OurTabDatabase) { return db.select().from(groups).orderBy(asc(groups.sortOrder)).all() }
export function getGroup(db: OurTabDatabase, id: string) { return db.select().from(groups).where(eq(groups.id, id)).get() || null }
export function createGroup(db: OurTabDatabase, input: CreateGroupInput) {
  const timestamp = now()
  const row = { id: randomUUID(), name: input.name, icon: input.icon ?? null, sortOrder: input.sortOrder ?? listGroups(db).length, createdAt: timestamp, updatedAt: timestamp }
  db.insert(groups).values(row).run()
  return row
}
export function updateGroup(db: OurTabDatabase, id: string, input: UpdateGroupInput) {
  db.update(groups).set({ name: input.name, icon: input.icon, sortOrder: input.sortOrder, updatedAt: now() }).where(eq(groups.id, id)).run()
  return getGroup(db, id)
}
export function deleteGroup(db: OurTabDatabase, id: string) { db.delete(groups).where(eq(groups.id, id)).run() }
export function reorderGroups(db: OurTabDatabase, items: ReorderItem[]) {
  const timestamp = now()
  db.transaction((tx) => { for (const item of items) tx.update(groups).set({ sortOrder: item.sortOrder, updatedAt: timestamp }).where(eq(groups.id, item.id)).run() })
}
