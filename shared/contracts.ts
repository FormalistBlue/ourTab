export type OpenMode = 'current' | 'new-tab'
export type WallpaperKind = 'builtin' | 'upload' | 'shader'

export interface LinkItem {
  id: string
  groupId: string
  title: string
  url: string
  iconPath: string | null
  iconColor: string
  openMode: OpenMode
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface LinkGroup {
  id: string
  workspaceId: string
  name: string
  sortOrder: number
  links: LinkItem[]
}

export interface Workspace {
  id: string
  name: string
  sortOrder: number
  wallpaperId: string | null
  groups: LinkGroup[]
}

export interface Wallpaper {
  id: string
  name: string
  kind: WallpaperKind
  imagePath: string | null
  thumbnailPath: string | null
  shaderPreset: string | null
  createdAt: string
}

export interface AppPreferences {
  searchEngine: 'google' | 'bing' | 'baidu'
  defaultOpenMode: OpenMode
  globalWallpaperId: string | null
  shaderEnabled: boolean
  shaderIntensity: number
  iconSize: number
}

export interface DashboardSnapshot {
  revision: number
  workspaces: Workspace[]
  wallpapers: Wallpaper[]
  preferences: AppPreferences
}

export interface SessionUser {
  id: string
  username: string
  sessionVersion: number
}

export interface ApiMutationResult<T> {
  revision: number
  data: T
}

export interface LinkMetadata {
  normalizedUrl: string
  title: string | null
  iconPath: string | null
  iconColor: string
}
