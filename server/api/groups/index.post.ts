import { groupCreateSchema } from '../../../shared/validation'
import { createGroup } from '../../services/resources'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  const body = await readSchemaBody(event, groupCreateSchema)
  return createGroup(body.workspaceId, body.name)
})
