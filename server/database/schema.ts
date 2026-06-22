import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const tabs = sqliteTable('tabs', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  iconType: text('icon_type').notNull().default('auto'),
  iconColor: text('icon_color'),
  iconBackgroundColor: text('icon_background_color'),
  isFolder: integer('is_folder', { mode: 'boolean' }).notNull().default(false),
  folderId: text('folder_id').references((): any => tabs.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})
