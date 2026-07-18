import { createWallpaper } from '../../services/wallpapers'
import { assertSameOrigin, requireAppUser } from '../../utils/api'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireAppUser(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data)
  const name = parts?.find(part => part.name === 'name')?.data.toString('utf8') || '自定义壁纸'
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: '请选择壁纸文件' })
  return createWallpaper(name, file.data)
})
