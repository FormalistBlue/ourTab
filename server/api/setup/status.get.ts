import { users } from '../../database/schema'
import { getDb } from '../../database/client'

export default defineEventHandler(() => ({
  configured: Boolean(getDb().select({ id: users.id }).from(users).limit(1).get())
}))
