import { sql } from 'drizzle-orm'
import { getDb } from '../database/client'

export default defineEventHandler(() => {
  getDb().run(sql`select 1`)
  return { status: 'ok', service: 'ourTab', time: new Date().toISOString() }
})
