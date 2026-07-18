import { orderedIdsSchema } from '../../../../../shared/validation'
import { orderLinks } from '../../../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return orderLinks(getRouteId(event), (await readSchemaBody(event, orderedIdsSchema)).ids)
})
