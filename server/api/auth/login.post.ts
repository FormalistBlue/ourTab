import { eq } from 'drizzle-orm'
import { loginSchema } from '../../../shared/validation'
import { users } from '../../database/schema'
import { getDb } from '../../database/client'
import { assertSameOrigin, readSchemaBody } from '../../utils/api'
import { clearRateLimit, enforceRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  enforceRateLimit(event, 'login', 8, 5 * 60_000)
  const body = await readSchemaBody(event, loginSchema)
  const row = getDb().select().from(users).where(eq(users.username, body.username)).get()

  if (!row || !(await verifyPassword(row.passwordHash, body.password))) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  clearRateLimit(event, 'login')
  const user = { id: row.id, username: row.username, sessionVersion: row.sessionVersion }
  await setUserSession(event, { user, loggedInAt: new Date().toISOString() }, { maxAge: 60 * 60 * 24 * 30 })
  return { user }
})
