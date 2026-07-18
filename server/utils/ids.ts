export function createId() {
  return crypto.randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}
