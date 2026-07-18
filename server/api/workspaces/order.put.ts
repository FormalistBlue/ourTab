import { orderedIdsSchema } from '../../../shared/validation'
import { orderWorkspaces } from '../../services/resources'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return orderWorkspaces((await readSchemaBody(event, orderedIdsSchema)).ids)
})
