import { workspaceCreateSchema } from '../../../shared/validation'
import { createWorkspace } from '../../services/resources'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return createWorkspace((await readSchemaBody(event, workspaceCreateSchema)).name)
})
