import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part))) return true
  const a = parts[0] || -1
  const b = parts[1] || -1
  return a === 0
    || a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a >= 224
}

function isPrivateIp(address: string) {
  if (isIP(address) === 4) return isPrivateIpv4(address)
  const normalized = address.toLowerCase()
  return normalized === '::1'
    || normalized === '::'
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || normalized.startsWith('fe8')
    || normalized.startsWith('fe9')
    || normalized.startsWith('fea')
    || normalized.startsWith('feb')
    || normalized.startsWith('ff')
    || normalized.startsWith('::ffff:127.')
    || normalized.startsWith('::ffff:10.')
    || normalized.startsWith('::ffff:192.168.')
}

async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 http/https 元数据地址' })
  }
  if (!url.hostname || url.hostname === 'localhost') {
    throw createError({ statusCode: 400, statusMessage: '不能访问本机地址' })
  }
  const records = await lookup(url.hostname, { all: true, verbatim: true })
  if (!records.length || records.some(record => isPrivateIp(record.address))) {
    throw createError({ statusCode: 400, statusMessage: '不能抓取内网或保留地址' })
  }
}

export async function safeFetch(input: string, options: { maxRedirects?: number; timeoutMs?: number; allowStatuses?: number[] } = {}) {
  let url = new URL(input)
  const maxRedirects = options.maxRedirects ?? 3

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    await assertPublicUrl(url)
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs ?? 4_000),
      headers: {
        'user-agent': 'ourTab/1.0 (+https://ourtab.shandawang.cc)',
        accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/*;q=0.8'
      }
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirect === maxRedirects) {
        throw createError({ statusCode: 422, statusMessage: '目标重定向次数过多' })
      }
      url = new URL(location, url)
      continue
    }
    if (!response.ok && !options.allowStatuses?.includes(response.status)) {
      throw createError({ statusCode: 422, statusMessage: `目标站点返回 ${response.status}` })
    }
    return { response, finalUrl: url }
  }
  throw createError({ statusCode: 422, statusMessage: '无法抓取目标站点' })
}

export async function readLimitedBody(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > maxBytes) throw createError({ statusCode: 413, statusMessage: '远程内容过大' })
  const reader = response.body?.getReader()
  if (!reader) return Buffer.alloc(0)

  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw createError({ statusCode: 413, statusMessage: '远程内容过大' })
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
