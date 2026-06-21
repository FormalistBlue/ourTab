import type { ReorderItem } from '~/types/ourtab'

export function buildReorderItems(ids: string[]): ReorderItem[] {
  return ids.map((id, sortOrder) => ({ id, sortOrder }))
}
