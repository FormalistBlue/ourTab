import { getDashboard } from '../services/dashboard'
import { requireAppUser } from '../utils/api'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const dashboard = getDashboard(user.id)
  const etag = `"${dashboard.revision}"`
  setHeader(event, 'etag', etag)

  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }
  return dashboard
})
