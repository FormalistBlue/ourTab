import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { preferences, wallpapers, workspaces } from '../database/schema'
import { getDb, resolveRuntimePath, withTransaction } from '../database/client'
import { createId, nowIso } from '../utils/ids'
import { bumpRevision } from '../utils/revision'

export async function createWallpaper(name: string, source: Buffer) {
  if (source.length > 15 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: '壁纸不能超过 15MB' })
  }

  const image = sharp(source, { limitInputPixels: 8192 * 8192, failOn: 'error' }).rotate()
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height || metadata.width > 8192 || metadata.height > 8192) {
    throw createError({ statusCode: 400, statusMessage: '壁纸尺寸无效或过大' })
  }

  const id = createId()
  const config = useRuntimeConfig()
  const directory = join(resolveRuntimePath(config.uploadsDir), 'wallpapers', id)
  await mkdir(directory, { recursive: true })
  const mainPath = join(directory, 'wallpaper.avif')
  const thumbPath = join(directory, 'thumbnail.webp')
  await Promise.all([
    image.clone().resize({ width: 3840, height: 2160, fit: 'inside', withoutEnlargement: true }).avif({ quality: 72, effort: 5 }).toFile(mainPath),
    image.clone().resize({ width: 640, height: 360, fit: 'cover' }).webp({ quality: 78 }).toFile(thumbPath)
  ])

  const timestamp = nowIso()
  return withTransaction(() => {
    const db = getDb()
    db.insert(wallpapers).values({
      id,
      name: name.trim().slice(0, 40) || '自定义壁纸',
      kind: 'upload',
      imagePath: `/uploads/wallpapers/${id}/wallpaper.avif`,
      thumbnailPath: `/uploads/wallpapers/${id}/thumbnail.webp`,
      shaderPreset: null,
      createdAt: timestamp
    }).run()
    return { id, revision: bumpRevision(db) }
  })
}

export async function deleteWallpaper(id: string) {
  const db = getDb()
  const wallpaper = db.select().from(wallpapers).where(eq(wallpapers.id, id)).get()
  if (!wallpaper) throw createError({ statusCode: 404, statusMessage: '壁纸不存在' })
  if (wallpaper.kind !== 'upload') throw createError({ statusCode: 400, statusMessage: '内置壁纸不能删除' })

  const result = withTransaction(() => {
    db.update(preferences).set({ globalWallpaperId: null, updatedAt: nowIso() }).where(eq(preferences.globalWallpaperId, id)).run()
    db.update(workspaces).set({ wallpaperId: null, updatedAt: nowIso() }).where(eq(workspaces.wallpaperId, id)).run()
    db.delete(wallpapers).where(eq(wallpapers.id, id)).run()
    return { revision: bumpRevision(db) }
  })

  const config = useRuntimeConfig()
  await rm(join(resolveRuntimePath(config.uploadsDir), 'wallpapers', id), { recursive: true, force: true })
  return result
}
