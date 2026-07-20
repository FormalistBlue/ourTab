import { timingSafeEqual } from 'node:crypto'
import { setupSchema } from '../../shared/validation'
import { appState, linkGroups, preferences, users, wallpapers, workspaces } from '../database/schema'
import { getDb } from '../database/client'
import { createId, nowIso } from '../utils/ids'
import { enforceRateLimit } from '../utils/rate-limit'
import { assertSameOrigin, readSchemaBody } from '../utils/api'

function tokensMatch(actual: string, expected: string) {
  if (!actual || !expected) return false
  const left = Buffer.from(actual)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  enforceRateLimit(event, 'setup', 5, 5 * 60_000)

  const db = getDb()
  if (db.select({ id: users.id }).from(users).limit(1).get()) {
    throw createError({ statusCode: 409, statusMessage: '应用已经完成初始化' })
  }

  const body = await readSchemaBody(event, setupSchema)
  const config = useRuntimeConfig(event)
  if (!tokensMatch(body.token, config.setupToken)) {
    throw createError({ statusCode: 403, statusMessage: '初始化令牌无效' })
  }

  const timestamp = nowIso()
  const userId = createId()
  const workspaceId = createId()
  const groupId = createId()
  const builtinWallpaperId = createId()
  const shaderWallpaperId = createId()
  const passwordHash = await hashPassword(body.password)

  db.transaction((tx) => {
    tx.insert(users).values({
      id: userId,
      username: body.username,
      passwordHash,
      sessionVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    }).run()
    tx.insert(wallpapers).values([
      {
        id: builtinWallpaperId,
        name: '晨雾山野',
        kind: 'builtin',
        imagePath: null,
        thumbnailPath: null,
        shaderPreset: null,
        createdAt: timestamp
      },
      {
        id: shaderWallpaperId,
        name: '雾光流域',
        kind: 'shader',
        imagePath: null,
        thumbnailPath: null,
        shaderPreset: 'mist-field',
        createdAt: timestamp
      }
    ]).run()
    tx.insert(workspaces).values({
      id: workspaceId,
      name: '常用',
      sortOrder: 0,
      wallpaperId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }).run()
    tx.insert(linkGroups).values({
      id: groupId,
      workspaceId,
      name: '常用',
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    }).run()
    tx.insert(preferences).values({
      userId,
      searchEngine: 'google',
      defaultOpenMode: 'current',
      theme: 'mist',
      globalWallpaperId: builtinWallpaperId,
      shaderEnabled: false,
      shaderIntensity: 0.55,
      iconSize: 64,
      tileRadius: 18,
      tileOpacity: 0.055,
      gridGap: 11,
      heroOffset: 24,
      updatedAt: timestamp
    }).run()
    tx.insert(appState).values({ id: 1, revision: 1, updatedAt: timestamp })
      .onConflictDoUpdate({ target: appState.id, set: { revision: 1, updatedAt: timestamp } }).run()
  })

  const user = { id: userId, username: body.username, sessionVersion: 1 }
  await setUserSession(event, { user, loggedInAt: timestamp }, { maxAge: 60 * 60 * 24 * 30 })
  return { user }
})
