import { workspaceUpdateSchema } from '../../../shared/validation'
import { updateWorkspace } from '../../services/resources'
import { assertSameOrigin, getRouteId, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return updateWorkspace(getRouteId(event), await readSchemaBody(event, workspaceUpdateSchema))
})
