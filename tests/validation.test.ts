import { describe, expect, it } from 'vitest'
import { linkCreateSchema, preferencesSchema, setupSchema } from '../shared/validation'

describe('ourTab validation contracts', () => {
  it('accepts a secure setup payload and rejects short passwords', () => {
    expect(setupSchema.safeParse({ token: 'a'.repeat(16), username: 'admin', password: 'a'.repeat(12) }).success).toBe(true)
    expect(setupSchema.safeParse({ token: 'a'.repeat(16), username: 'admin', password: 'short' }).success).toBe(false)
  })

  it('accepts links without a protocol because the server normalizes them', () => {
    expect(linkCreateSchema.safeParse({ groupId: crypto.randomUUID(), title: 'GitHub', url: 'github.com' }).success).toBe(true)
  })

  it('keeps protocol policy in the server normalization layer', () => {
    expect(linkCreateSchema.safeParse({ groupId: crypto.randomUUID(), title: 'Bad', url: 'javascript:alert(1)' }).success).toBe(true)
  })

  it('accepts the visual preference ranges and rejects unsafe extremes', () => {
    expect(preferencesSchema.safeParse({
      theme: 'paper',
      iconSize: 96,
      tileRadius: 24,
      tileOpacity: 0.12,
      gridGap: 14,
      heroOffset: 24
    }).success).toBe(true)
    expect(preferencesSchema.safeParse({ iconSize: 120 }).success).toBe(false)
    expect(preferencesSchema.safeParse({ tileOpacity: 0.5 }).success).toBe(false)
  })
})
