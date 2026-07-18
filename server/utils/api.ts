import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users } from '../database/schema'
import { getDb } from '../database/client'
import type { SessionUser } from '../../shared/contracts'

export async function requireAppUser(event: H3Event): Promise<SessionUser> {
  const session = await requireUserSession(event)
  const sessionUser = session.user as unknown as SessionUser
  const user = getDb().select({
    id: users.id,
    username: users.username,
    sessionVersion: users.sessionVersion
  }).from(users).where(eq(users.id, sessionUser.id)).get()

  if (!user || user.sessionVersion !== sessionUser.sessionVersion) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: '登录状态已失效' })
  }
  return user
}

export function assertSameOrigin(event: H3Event) {
  const method = event.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  const origin = getHeader(event, 'origin')
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  if (!origin || !host) return

  const originHost = (() => {
    try { return new URL(origin).host } catch { throw createError({ statusCode: 403, statusMessage: '请求来源无效' }) }
  })()
  if (originHost !== host) {
    throw createError({ statusCode: 403, statusMessage: '拒绝跨站请求' })
  }
}

export async function readSchemaBody<T>(event: H3Event, schema: { parse: (value: unknown) => T }) {
  try {
    return schema.parse(await readBody(event))
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : '请求参数无效'
    })
  }
}

export function getRouteId(event: H3Event) {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少资源 ID' })
  return id
}
