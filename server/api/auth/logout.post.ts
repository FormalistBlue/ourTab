import { assertSameOrigin } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await clearUserSession(event)
  return { success: true }
})
