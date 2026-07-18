import { linkUpdateSchema } from '../../../shared/validation'
import { updateLink } from '../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return updateLink(getRouteId(event), await readSchemaBody(event, linkUpdateSchema))
})
