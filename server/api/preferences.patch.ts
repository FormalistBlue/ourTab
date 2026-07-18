import { preferencesSchema } from '../../shared/validation'
import { updatePreferences } from '../services/resources'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireAppUser(event)
  return updatePreferences(user.id, await readSchemaBody(event, preferencesSchema))
})
