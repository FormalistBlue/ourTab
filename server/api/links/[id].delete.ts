import { deleteLink } from '../../services/resources'
import { assertSameOrigin, getRouteId, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return deleteLink(getRouteId(event))
})
