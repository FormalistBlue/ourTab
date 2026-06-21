import ContextMenu from '@imengyu/vue3-context-menu'

export interface ContextMenuAction { label: string; onClick: () => void }

export function showContextMenu(event: MouseEvent, actions: ContextMenuAction[]) {
  event.preventDefault()
  ContextMenu.showContextMenu({ x: event.x, y: event.y, items: actions.map((action) => ({ label: action.label, onClick: action.onClick })) })
}
