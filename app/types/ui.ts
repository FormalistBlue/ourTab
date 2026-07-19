export interface MenuPoint {
  x: number
  y: number
}

export type ContextMenuIcon = 'external' | 'edit' | 'image' | 'trash' | 'settings' | 'plus'

export interface ContextMenuItem {
  id: string
  label: string
  icon: ContextMenuIcon
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

export interface PromptDialogOptions {
  title: string
  label: string
  value?: string
  placeholder?: string
  confirmLabel?: string
}

export interface PromptDialogApi {
  open: (options: PromptDialogOptions) => Promise<string | null>
}

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export interface ConfirmDialogApi {
  open: (options: ConfirmDialogOptions) => Promise<boolean>
}

export type SettingsSection = 'workspace' | 'appearance' | 'wallpaper' | 'account'
