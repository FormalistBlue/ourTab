import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { load } from 'cheerio'
import sharp from 'sharp'
import type { LinkMetadata } from '../../shared/contracts'
import { resolveRuntimePath } from '../database/client'
import { createId } from '../utils/ids'
import { normalizeHttpUrl } from './resources'
import { readLimitedBody, safeFetch } from './safe-fetch'

function colorToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

async function cacheIcon(iconUrl: string) {
  const { response } = await safeFetch(iconUrl, { timeoutMs: 4_000 })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/') && !['application/octet-stream', 'binary/octet-stream'].includes(contentType.split(';')[0] || '')) {
    throw createError({ statusCode: 422, statusMessage: '站点图标不是图片' })
  }
  const source = await readLimitedBody(response, 768 * 1024)
  const image = sharp(source, { density: 192, limitInputPixels: 4096 * 4096 }).resize(128, 128, { fit: 'contain' })
  const stats = await image.clone().removeAlpha().stats()
  const iconColor = colorToHex(stats.dominant.r, stats.dominant.g, stats.dominant.b)
  const id = createId()
  const config = useRuntimeConfig()
  const directory = join(resolveRuntimePath(config.uploadsDir), 'icons')
  await mkdir(directory, { recursive: true })
  await image.webp({ quality: 88 }).toFile(join(directory, `${id}.webp`))
  return { iconPath: `/uploads/icons/${id}.webp`, iconColor }
}

async function fallbackMetadata(normalizedUrl: string, iconBaseUrl = normalizedUrl): Promise<LinkMetadata> {
  try {
    const icon = await cacheIcon(new URL('/favicon.ico', iconBaseUrl).toString())
    return { normalizedUrl, title: new URL(normalizedUrl).hostname, ...icon }
  } catch {
    return { normalizedUrl, title: new URL(normalizedUrl).hostname, iconPath: null, iconColor: '#d6a85f' }
  }
}

export async function resolveLinkMetadata(input: string): Promise<LinkMetadata> {
  const normalizedUrl = normalizeHttpUrl(input)
  const { response, finalUrl } = await safeFetch(normalizedUrl, { allowStatuses: [401, 403] })
  if (response.status === 401 || response.status === 403) return fallbackMetadata(normalizedUrl, finalUrl.toString())
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    return fallbackMetadata(normalizedUrl, finalUrl.toString())
  }

  const html = (await readLimitedBody(response, 1024 * 1024)).toString('utf8')
  const $ = load(html)
  const rawTitle = $('title').first().text().replace(/\s+/g, ' ').trim()
  const title = rawTitle ? rawTitle.slice(0, 80) : finalUrl.hostname
  const iconHref = $('link[rel~="icon"]').last().attr('href')
    || $('link[rel="shortcut icon"]').last().attr('href')
    || '/favicon.ico'

  try {
    const iconUrl = new URL(iconHref, finalUrl).toString()
    const icon = await cacheIcon(iconUrl)
    return { normalizedUrl, title, ...icon }
  } catch {
    return { normalizedUrl, title, iconPath: null, iconColor: '#d6a85f' }
  }
}
