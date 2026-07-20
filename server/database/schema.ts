import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  sessionVersion: integer('session_version').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, table => [uniqueIndex('users_username_unique').on(table.username)])

export const wallpapers = sqliteTable('wallpapers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['builtin', 'upload', 'shader'] }).notNull(),
  imagePath: text('image_path'),
  thumbnailPath: text('thumbnail_path'),
  shaderPreset: text('shader_preset'),
  createdAt: text('created_at').notNull()
})

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
  wallpaperId: text('wallpaper_id').references(() => wallpapers.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const linkGroups = sqliteTable('link_groups', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const links = sqliteTable('links', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => linkGroups.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  iconPath: text('icon_path'),
  iconColor: text('icon_color').notNull().default('#d6a85f'),
  openMode: text('open_mode', { enum: ['current', 'new-tab'] }).notNull().default('current'),
  sortOrder: integer('sort_order').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const preferences = sqliteTable('preferences', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  searchEngine: text('search_engine', { enum: ['google', 'bing', 'baidu'] }).notNull().default('google'),
  defaultOpenMode: text('default_open_mode', { enum: ['current', 'new-tab'] }).notNull().default('current'),
  theme: text('theme', { enum: ['mist', 'paper'] }).notNull().default('mist'),
  globalWallpaperId: text('global_wallpaper_id').references(() => wallpapers.id, { onDelete: 'set null' }),
  shaderEnabled: integer('shader_enabled', { mode: 'boolean' }).notNull().default(false),
  shaderIntensity: real('shader_intensity').notNull().default(0.55),
  iconSize: integer('icon_size').notNull().default(64),
  tileRadius: integer('tile_radius').notNull().default(18),
  tileOpacity: real('tile_opacity').notNull().default(0.055),
  gridGap: integer('grid_gap').notNull().default(11),
  heroOffset: integer('hero_offset').notNull().default(24),
  updatedAt: text('updated_at').notNull()
})

export const appState = sqliteTable('app_state', {
  id: integer('id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull()
})
