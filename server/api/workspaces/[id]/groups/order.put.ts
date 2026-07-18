import { orderedIdsSchema } from '../../../../../shared/validation'
import { orderGroups } from '../../../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return orderGroups(getRouteId(event), (await readSchemaBody(event, orderedIdsSchema)).ids)
})
