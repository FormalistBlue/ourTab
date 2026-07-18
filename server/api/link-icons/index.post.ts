import { createCustomIcon } from '../../services/icons'
import { assertSameOrigin, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data)
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: '请选择图标图片' })
  return createCustomIcon(file.data)
})
