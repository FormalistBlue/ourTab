import { describe, expect, it } from 'vitest'
import { versionedUploadUrl } from '../app/utils/assets'

describe('versionedUploadUrl', () => {
  it('adds a stable version to uploaded assets', () => {
    expect(versionedUploadUrl('/uploads/icons/icon.webp', '2026-07-18T15:40:00.000Z')).toBe('/uploads/icons/icon.webp?v=2026-07-18T15%3A40%3A00.000Z')
  })

  it('preserves existing query parameters', () => {
    expect(versionedUploadUrl('/uploads/wallpaper.avif?size=large', '2')).toBe('/uploads/wallpaper.avif?size=large&v=2')
  })

  it('leaves external and empty paths unchanged', () => {
    expect(versionedUploadUrl('https://example.com/icon.png', '2')).toBe('https://example.com/icon.png')
    expect(versionedUploadUrl(null, '2')).toBeNull()
  })
})
