import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { resolveRuntimePath } from '../database/client'
import { createId } from '../utils/ids'

const MAX_ICON_BYTES = 3 * 1024 * 1024
const MAX_ICON_EDGE = 4096
const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif'])

function colorToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

export async function createCustomIcon(source: Buffer) {
  if (source.length > MAX_ICON_BYTES) {
    throw createError({ statusCode: 413, statusMessage: '图标不能超过 3MB' })
  }

  const image = sharp(source, { limitInputPixels: MAX_ICON_EDGE * MAX_ICON_EDGE, failOn: 'error' }).rotate()
  let metadata: Awaited<ReturnType<typeof image.metadata>>
  try {
    metadata = await image.metadata()
  } catch {
    throw createError({ statusCode: 400, statusMessage: '图标图片无法读取' })
  }
  if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format) || !metadata.width || !metadata.height || metadata.width > MAX_ICON_EDGE || metadata.height > MAX_ICON_EDGE) {
    throw createError({ statusCode: 400, statusMessage: '请选择 JPEG、PNG、WebP 或 AVIF 图片' })
  }

  const normalized = image.resize(256, 256, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    withoutEnlargement: true
  })
  let stats: Awaited<ReturnType<typeof normalized.stats>>
  let output: Buffer
  try {
    [stats, output] = await Promise.all([
      normalized.clone().flatten({ background: '#d6a85f' }).removeAlpha().stats(),
      normalized.clone().webp({ quality: 90 }).toBuffer()
    ])
  } catch {
    throw createError({ statusCode: 400, statusMessage: '图标图片损坏或格式不受支持' })
  }
  const iconColor = colorToHex(stats.dominant.r, stats.dominant.g, stats.dominant.b)
  const id = createId()
  const config = useRuntimeConfig()
  const directory = join(resolveRuntimePath(config.uploadsDir), 'icons')
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, `${id}.webp`), output)

  return { iconPath: `/uploads/icons/${id}.webp`, iconColor }
}
