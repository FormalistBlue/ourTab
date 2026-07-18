import { groupUpdateSchema } from '../../../shared/validation'
import { updateGroup } from '../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return updateGroup(getRouteId(event), (await readSchemaBody(event, groupUpdateSchema)).name)
})
