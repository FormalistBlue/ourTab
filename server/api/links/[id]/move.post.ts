import { moveLinkSchema } from '../../../../shared/validation'
import { moveLink } from '../../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  const body = await readSchemaBody(event, moveLinkSchema)
  return moveLink(getRouteId(event), body.targetGroupId, body.targetIndex)
})
