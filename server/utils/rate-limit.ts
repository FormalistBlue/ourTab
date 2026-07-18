import type { H3Event } from 'h3'

interface AttemptWindow {
  count: number
  resetAt: number
}

const attempts = new Map<string, AttemptWindow>()

export function enforceRateLimit(event: H3Event, scope: string, limit = 8, windowMs = 60_000) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `${scope}:${ip}`
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (current.count >= limit) {
    throw createError({ statusCode: 429, statusMessage: '尝试次数过多，请稍后再试' })
  }
  current.count += 1
}

export function clearRateLimit(event: H3Event, scope: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  attempts.delete(`${scope}:${ip}`)
}
