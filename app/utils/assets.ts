export function versionedUploadUrl(path: string | null, version: string) {
  if (!path || !path.startsWith('/uploads/') || !version) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}v=${encodeURIComponent(version)}`
}
