import { deleteWallpaper } from '../../services/wallpapers'
import { assertSameOrigin, getRouteId, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return deleteWallpaper(getRouteId(event))
})
