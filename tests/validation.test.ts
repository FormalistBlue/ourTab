import { describe, expect, it } from 'vitest'
import { linkCreateSchema, setupSchema } from '../shared/validation'

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
})
