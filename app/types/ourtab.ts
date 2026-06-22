export type IconType = 'auto' | 'text' | 'custom'
export type BackgroundType = 'gradient' | 'image' | 'color'
export type LocaleCode = 'zh-CN' | 'en-US'

export interface SearchEngine { id: string; name: string; url: string }
export interface BackgroundSetting { type: BackgroundType; value: string }

export interface AppSettings {
  search_engine: string
  search_engines: SearchEngine[]
  theme: string
  language: LocaleCode
  background: BackgroundSetting
  sidebar_collapsed: boolean
}

export interface Group { id: string; name: string; icon: string | null; sortOrder: number; createdAt: string; updatedAt: string }
export interface Tab { id: string; groupId: string; name: string; url: string; icon: string | null; iconType: IconType; iconColor?: string | null; iconBackgroundColor?: string | null; isFolder: boolean; folderId: string | null; sortOrder: number; createdAt: string; updatedAt: string }
export interface CreateGroupInput { name: string; icon?: string | null; sortOrder?: number }
export interface UpdateGroupInput { name?: string; icon?: string | null; sortOrder?: number }
export interface CreateTabInput { groupId: string; name: string; url: string; icon?: string | null; iconType: IconType; iconColor?: string | null; iconBackgroundColor?: string | null; isFolder: boolean; folderId?: string | null; sortOrder?: number }
export interface UpdateTabInput { groupId?: string; name?: string; url?: string; icon?: string | null; iconType?: IconType; iconColor?: string | null; iconBackgroundColor?: string | null; isFolder?: boolean; folderId?: string | null; sortOrder?: number }
export interface ReorderItem { id: string; sortOrder: number }

export interface ThemeConfig {
  name: string
  label: string
  colors: Record<'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'textSecondary' | 'border' | 'success' | 'warning' | 'error', string>
  components: {
    sidebar: Record<'width' | 'background' | 'blur' | 'borderRadius', string>
    searchBar: Record<'width' | 'height' | 'background' | 'borderRadius' | 'shadow', string>
    tabItem: Record<'width' | 'height' | 'background' | 'borderRadius' | 'shadow' | 'hoverEffect', string>
    folderModal: Record<'background' | 'blur' | 'borderRadius', string>
    settingsModal: Record<'width' | 'background' | 'blur', string>
  }
  animations: Record<'tabHover' | 'tabClick' | 'modalEnter' | 'modalLeave' | 'sidebarToggle', string>
}

export interface ExportPayload { version: '1.0'; exportedAt: string; groups: Group[]; tabs: Tab[]; settings: AppSettings }
