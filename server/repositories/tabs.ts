import { randomUUID } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import type { CreateTabInput, ReorderItem, UpdateTabInput } from '../../app/types/ourtab'
import type { OurTabDatabase } from '../database/client'
import { tabs } from '../database/schema'

function now() { return new Date().toISOString() }
export function listTabs(db: OurTabDatabase) { return db.select().from(tabs).orderBy(asc(tabs.sortOrder)).all() }
export function getTab(db: OurTabDatabase, id: string) { return db.select().from(tabs).where(eq(tabs.id, id)).get() || null }
export function createTab(db: OurTabDatabase, input: CreateTabInput) {
  const timestamp = now()
  const scopedTabs = listTabs(db).filter((tab) => tab.groupId === input.groupId && tab.folderId === (input.folderId ?? null))
  const row = { id: randomUUID(), groupId: input.groupId, name: input.name, url: input.url, icon: input.icon ?? null, iconType: input.iconType, iconColor: input.iconColor ?? null, iconBackgroundColor: input.iconBackgroundColor ?? null, isFolder: input.isFolder, folderId: input.folderId ?? null, sortOrder: input.sortOrder ?? scopedTabs.length, createdAt: timestamp, updatedAt: timestamp }
  db.insert(tabs).values(row).run()
  return row
}
export function updateTab(db: OurTabDatabase, id: string, input: UpdateTabInput) {
  db.update(tabs).set({ groupId: input.groupId, name: input.name, url: input.url, icon: input.icon, iconType: input.iconType, iconColor: input.iconColor, iconBackgroundColor: input.iconBackgroundColor, isFolder: input.isFolder, folderId: input.folderId, sortOrder: input.sortOrder, updatedAt: now() }).where(eq(tabs.id, id)).run()
  return getTab(db, id)
}
export function deleteTab(db: OurTabDatabase, id: string) { db.delete(tabs).where(eq(tabs.id, id)).run() }
export function reorderTabs(db: OurTabDatabase, items: ReorderItem[]) {
  const timestamp = now()
  db.transaction((tx) => { for (const item of items) tx.update(tabs).set({ sortOrder: item.sortOrder, updatedAt: timestamp }).where(eq(tabs.id, item.id)).run() })
}
