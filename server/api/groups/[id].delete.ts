import { deleteGroup } from '../../services/resources'
import { assertSameOrigin, getRouteId, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return deleteGroup(getRouteId(event))
})
