import { metadataSchema } from '../../../shared/validation'
import { resolveLinkMetadata } from '../../services/metadata'
import { assertSameOrigin, readSchemaBody, requireAppUser } from '../../utils/api'
import { enforceRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  enforceRateLimit(event, 'metadata', 20, 60_000)
  return resolveLinkMetadata((await readSchemaBody(event, metadataSchema)).url)
})
