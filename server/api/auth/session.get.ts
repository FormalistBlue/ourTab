import { requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  try {
    return { user: await requireAppUser(event) }
  } catch {
    return { user: null }
  }
})
