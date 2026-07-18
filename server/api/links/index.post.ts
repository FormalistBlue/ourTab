import { linkCreateSchema } from '../../../shared/validation'
import { createLink } from '../../services/resources'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  return createLink(await readSchemaBody(event, linkCreateSchema))
})
