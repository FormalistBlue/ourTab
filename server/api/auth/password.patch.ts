import { eq, sql } from 'drizzle-orm'
import { passwordChangeSchema } from '../../../shared/validation'
import { users } from '../../database/schema'
import { getDb } from '../../database/client'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'
import { nowIso } from '../../utils/ids'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireAppUser(event)
  const body = await readSchemaBody(event, passwordChangeSchema)
  const db = getDb()
  const row = db.select().from(users).where(eq(users.id, user.id)).get()

  if (!row || !(await verifyPassword(row.passwordHash, body.currentPassword))) {
    throw createError({ statusCode: 403, statusMessage: '当前密码错误' })
  }

  const passwordHash = await hashPassword(body.newPassword)
  db.update(users).set({
    passwordHash,
    sessionVersion: sql`${users.sessionVersion} + 1`,
    updatedAt: nowIso()
  }).where(eq(users.id, user.id)).run()
  await clearUserSession(event)
  return { success: true }
})
