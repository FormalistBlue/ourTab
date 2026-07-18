export interface UploadedLinkIcon {
  iconPath: string
  iconColor: string
}

export async function uploadLinkIcon(file: File) {
  const body = new FormData()
  body.append('file', file)
  return $fetch<UploadedLinkIcon>('/api/link-icons', { method: 'POST', body })
}
