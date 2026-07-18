import { asc, count, eq, max } from 'drizzle-orm'
import type { OpenMode } from '../../shared/contracts'
import { linkGroups, links, preferences, wallpapers, workspaces } from '../database/schema'
import { getDb, withTransaction } from '../database/client'
import { bumpRevision } from '../utils/revision'
import { createId, nowIso } from '../utils/ids'

function notFound(name: string): never {
  throw createError({ statusCode: 404, statusMessage: `${name}不存在` })
}

function nextOrder(table: typeof workspaces | typeof linkGroups | typeof links, field: typeof workspaces.sortOrder | typeof linkGroups.sortOrder | typeof links.sortOrder) {
  const result = getDb().select({ value: max(field) }).from(table).get()
  return (result?.value ?? -1) + 1
}

export function normalizeHttpUrl(input: string) {
  const value = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: '网址格式无效' })
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError({ statusCode: 400, statusMessage: '只允许 http 或 https 网址' })
  }
  url.username = ''
  url.password = ''
  return url.toString()
}

export function createWorkspace(name: string) {
  return withTransaction(() => {
    const db = getDb()
    const timestamp = nowIso()
    const id = createId()
    const groupId = createId()
    const sortOrder = nextOrder(workspaces, workspaces.sortOrder)
    db.insert(workspaces).values({ id, name, sortOrder, createdAt: timestamp, updatedAt: timestamp }).run()
    db.insert(linkGroups).values({ id: groupId, workspaceId: id, name: '常用', sortOrder: 0, createdAt: timestamp, updatedAt: timestamp }).run()
    return { id, groupId, revision: bumpRevision(db) }
  })
}

export function updateWorkspace(id: string, values: { name?: string; wallpaperId?: string | null }) {
  return withTransaction(() => {
    const db = getDb()
    if (!db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, id)).get()) notFound('工作区')
    if (values.wallpaperId && !db.select({ id: wallpapers.id }).from(wallpapers).where(eq(wallpapers.id, values.wallpaperId)).get()) notFound('壁纸')
    db.update(workspaces).set({ ...values, updatedAt: nowIso() }).where(eq(workspaces.id, id)).run()
    return { id, revision: bumpRevision(db) }
  })
}

export function deleteWorkspace(id: string) {
  return withTransaction(() => {
    const db = getDb()
    const total = db.select({ value: count() }).from(workspaces).get()?.value ?? 0
    if (total <= 1) throw createError({ statusCode: 409, statusMessage: '至少保留一个工作区' })
    const result = db.delete(workspaces).where(eq(workspaces.id, id)).run()
    if (!result.changes) notFound('工作区')
    return { revision: bumpRevision(db) }
  })
}

export function createGroup(workspaceId: string, name: string) {
  return withTransaction(() => {
    const db = getDb()
    if (!db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, workspaceId)).get()) notFound('工作区')
    const id = createId()
    const timestamp = nowIso()
    const current = db.select({ value: max(linkGroups.sortOrder) }).from(linkGroups).where(eq(linkGroups.workspaceId, workspaceId)).get()
    db.insert(linkGroups).values({ id, workspaceId, name, sortOrder: (current?.value ?? -1) + 1, createdAt: timestamp, updatedAt: timestamp }).run()
    return { id, revision: bumpRevision(db) }
  })
}

export function updateGroup(id: string, name: string) {
  return withTransaction(() => {
    const db = getDb()
    const result = db.update(linkGroups).set({ name, updatedAt: nowIso() }).where(eq(linkGroups.id, id)).run()
    if (!result.changes) notFound('分组')
    return { id, revision: bumpRevision(db) }
  })
}

export function deleteGroup(id: string) {
  return withTransaction(() => {
    const db = getDb()
    const group = db.select().from(linkGroups).where(eq(linkGroups.id, id)).get()
    if (!group) notFound('分组')
    const total = db.select({ value: count() }).from(linkGroups).where(eq(linkGroups.workspaceId, group.workspaceId)).get()?.value ?? 0
    if (total <= 1) throw createError({ statusCode: 409, statusMessage: '每个工作区至少保留一个分组' })
    db.delete(linkGroups).where(eq(linkGroups.id, id)).run()
    return { revision: bumpRevision(db) }
  })
}

export function createLink(input: {
  groupId: string
  title: string
  url: string
  iconPath?: string | null
  iconColor?: string
  openMode?: OpenMode
}) {
  return withTransaction(() => {
    const db = getDb()
    if (!db.select({ id: linkGroups.id }).from(linkGroups).where(eq(linkGroups.id, input.groupId)).get()) notFound('分组')
    const id = createId()
    const timestamp = nowIso()
    const current = db.select({ value: max(links.sortOrder) }).from(links).where(eq(links.groupId, input.groupId)).get()
    db.insert(links).values({
      id,
      groupId: input.groupId,
      title: input.title,
      url: normalizeHttpUrl(input.url),
      iconPath: input.iconPath ?? null,
      iconColor: input.iconColor ?? '#d6a85f',
      openMode: input.openMode ?? 'current',
      sortOrder: (current?.value ?? -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    }).run()
    return { id, revision: bumpRevision(db) }
  })
}

export function updateLink(id: string, input: Partial<{
  title: string
  url: string
  iconPath: string | null
  iconColor: string
  openMode: OpenMode
}>) {
  return withTransaction(() => {
    const db = getDb()
    const values = { ...input, ...(input.url ? { url: normalizeHttpUrl(input.url) } : {}), updatedAt: nowIso() }
    const result = db.update(links).set(values).where(eq(links.id, id)).run()
    if (!result.changes) notFound('网址标签')
    return { id, revision: bumpRevision(db) }
  })
}

export function deleteLink(id: string) {
  return withTransaction(() => {
    const db = getDb()
    const result = db.delete(links).where(eq(links.id, id)).run()
    if (!result.changes) notFound('网址标签')
    return { revision: bumpRevision(db) }
  })
}

function validateOrder(actual: string[], requested: string[]) {
  if (actual.length !== requested.length || new Set(requested).size !== requested.length || actual.some(id => !requested.includes(id))) {
    throw createError({ statusCode: 400, statusMessage: '排序列表与当前数据不一致' })
  }
}

function applyOrder(table: typeof workspaces | typeof linkGroups | typeof links, ids: string[]) {
  const db = getDb()
  ids.forEach((id, sortOrder) => db.update(table).set({ sortOrder, updatedAt: nowIso() }).where(eq(table.id, id)).run())
}

export function orderWorkspaces(ids: string[]) {
  return withTransaction(() => {
    const db = getDb()
    const actual = db.select({ id: workspaces.id }).from(workspaces).orderBy(asc(workspaces.sortOrder)).all().map(row => row.id)
    validateOrder(actual, ids)
    applyOrder(workspaces, ids)
    return { revision: bumpRevision(db) }
  })
}

export function orderGroups(workspaceId: string, ids: string[]) {
  return withTransaction(() => {
    const db = getDb()
    const actual = db.select({ id: linkGroups.id }).from(linkGroups).where(eq(linkGroups.workspaceId, workspaceId)).orderBy(asc(linkGroups.sortOrder)).all().map(row => row.id)
    validateOrder(actual, ids)
    applyOrder(linkGroups, ids)
    return { revision: bumpRevision(db) }
  })
}

export function orderLinks(groupId: string, ids: string[]) {
  return withTransaction(() => {
    const db = getDb()
    const actual = db.select({ id: links.id }).from(links).where(eq(links.groupId, groupId)).orderBy(asc(links.sortOrder)).all().map(row => row.id)
    validateOrder(actual, ids)
    applyOrder(links, ids)
    return { revision: bumpRevision(db) }
  })
}

export function moveLink(id: string, targetGroupId: string, targetIndex: number) {
  return withTransaction(() => {
    const db = getDb()
    const link = db.select().from(links).where(eq(links.id, id)).get()
    if (!link) notFound('网址标签')
    if (!db.select({ id: linkGroups.id }).from(linkGroups).where(eq(linkGroups.id, targetGroupId)).get()) notFound('目标分组')

    const sourceIds = db.select({ id: links.id }).from(links).where(eq(links.groupId, link.groupId)).orderBy(asc(links.sortOrder)).all().map(row => row.id).filter(linkId => linkId !== id)
    const targetIds = link.groupId === targetGroupId
      ? sourceIds
      : db.select({ id: links.id }).from(links).where(eq(links.groupId, targetGroupId)).orderBy(asc(links.sortOrder)).all().map(row => row.id)
    targetIds.splice(Math.min(targetIndex, targetIds.length), 0, id)

    db.update(links).set({ groupId: targetGroupId, updatedAt: nowIso() }).where(eq(links.id, id)).run()
    if (link.groupId !== targetGroupId) applyOrder(links, sourceIds)
    applyOrder(links, targetIds)
    return { revision: bumpRevision(db) }
  })
}

export function updatePreferences(userId: string, input: Partial<{
  searchEngine: 'google' | 'bing' | 'baidu'
  defaultOpenMode: OpenMode
  globalWallpaperId: string | null
  shaderEnabled: boolean
  shaderIntensity: number
  iconSize: number
}>) {
  return withTransaction(() => {
    const db = getDb()
    if (input.globalWallpaperId && !db.select({ id: wallpapers.id }).from(wallpapers).where(eq(wallpapers.id, input.globalWallpaperId)).get()) notFound('壁纸')
    db.update(preferences).set({ ...input, updatedAt: nowIso() }).where(eq(preferences.userId, userId)).run()
    return { revision: bumpRevision(db) }
  })
}
