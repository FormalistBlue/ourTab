import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { resolveRuntimePath } from '../../database/client'

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const root = resolveRuntimePath(config.uploadsDir)
  const relativePath = getRouterParam(event, 'path') || ''
  const filePath = resolve(root, relativePath)
  if (!filePath.startsWith(`${root}${sep}`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    throw createError({ statusCode: 404, statusMessage: '文件不存在' })
  }
  setHeader(event, 'content-type', contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream')
  return sendStream(event, createReadStream(filePath))
})
