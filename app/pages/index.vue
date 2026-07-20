<script setup lang="ts">
import { LoaderCircle, Plus, Settings, Sparkles } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { AppPreferences, LinkGroup, LinkItem, Workspace } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'
import type { ConfirmDialogApi, ContextMenuItem, PromptDialogApi } from '../types/ui'

type MenuTarget =
  | { kind: 'link'; link: LinkItem }
  | { kind: 'background' }
  | { kind: 'workspace'; workspace: Workspace }

const store = useDashboardStore()
const editor = ref<{ open: (group: LinkGroup, link?: LinkItem) => void } | null>(null)
const iconEditor = ref<{ open: (link: LinkItem) => void } | null>(null)
const settings = ref<{ open: (section?: 'wallpaper') => void; close: () => void } | null>(null)
const promptDialog = ref<PromptDialogApi | null>(null)
const confirmDialog = ref<ConfirmDialogApi | null>(null)
const localGroups = ref<LinkGroup[]>([])
const now = ref(new Date())
const contextMenu = reactive<{ open: boolean; x: number; y: number; target: MenuTarget | null }>({ open: false, x: 0, y: 0, target: null })
let clockTimer: ReturnType<typeof setInterval> | undefined
let workspaceWheelTimer: ReturnType<typeof setTimeout> | undefined
let workspaceWheelLocked = false

const fallbackPreferences: AppPreferences = {
  searchEngine: 'google',
  defaultOpenMode: 'current',
  theme: 'mist',
  globalWallpaperId: null,
  shaderEnabled: false,
  shaderIntensity: 0.55,
  iconSize: 64,
  tileRadius: 18,
  tileOpacity: 0.055,
  gridGap: 11,
  heroOffset: 24
}

const activeWorkspace = computed(() => store.activeWorkspace)
const activePreferences = computed<AppPreferences>(() => ({
  ...fallbackPreferences,
  ...(store.snapshot?.preferences || {})
}))
const activeWallpaper = computed(() => {
  const workspaceWallpaper = activeWorkspace.value?.wallpaperId
  const wallpaperId = workspaceWallpaper || store.snapshot?.preferences.globalWallpaperId
  return store.snapshot?.wallpapers.find(wallpaper => wallpaper.id === wallpaperId) || null
})
const dateLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }).format(now.value))
const timeLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now.value))
const appearanceStyle = computed<Record<string, string>>(() => ({
  '--icon-size': `${activePreferences.value.iconSize}px`,
  '--tile-radius': `${activePreferences.value.tileRadius}px`,
  '--tile-opacity': `${activePreferences.value.tileOpacity}`,
  '--grid-gap': `${activePreferences.value.gridGap}px`,
  '--group-gap': `${Math.max(28, activePreferences.value.gridGap * 3.5)}px`,
  '--hero-offset': `${activePreferences.value.heroOffset}px`
}))
const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (contextMenu.target?.kind === 'link') {
    return [
      { id: 'open-new-tab', label: '在新标签页打开', icon: 'external' },
      { id: 'edit-link', label: '编辑标签', icon: 'edit' },
      { id: 'edit-icon', label: '编辑图标', icon: 'image' },
      { id: 'delete-link', label: '删除标签', icon: 'trash', danger: true, separatorBefore: true }
    ]
  }
  if (contextMenu.target?.kind === 'workspace') {
    return [
      { id: 'edit-workspace', label: '编辑工作区', icon: 'edit' },
      { id: 'delete-workspace', label: '删除工作区', icon: 'trash', danger: true, separatorBefore: true, disabled: store.workspaces.length <= 1 }
    ]
  }
  return [
    { id: 'open-settings', label: '设置', icon: 'settings' },
    { id: 'add-link', label: '添加图标', icon: 'plus' },
    { id: 'edit-background', label: '编辑背景', icon: 'image' }
  ]
})

watch(activeWorkspace, workspace => { localGroups.value = workspace ? [...workspace.groups] : [] }, { immediate: true, deep: true })

onMounted(async () => {
  await store.hydrate()
  await store.refresh()
  clockTimer = setInterval(() => { now.value = new Date() }, 30_000)
  document.addEventListener('visibilitychange', refreshOnVisible)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (workspaceWheelTimer) clearTimeout(workspaceWheelTimer)
  document.removeEventListener('visibilitychange', refreshOnVisible)
})

async function refreshOnVisible() {
  if (!document.hidden) await store.refresh({ quiet: true })
}

function selectWorkspace(id: string) {
  const change = () => store.selectWorkspace(id)
  if (document.startViewTransition) document.startViewTransition(change)
  else change()
}

function onWheel(event: WheelEvent) {
  if (workspaceWheelLocked || !event.deltaY || event.ctrlKey || store.workspaces.length < 2) return
  const target = event.target as HTMLElement | null
  if (target?.closest('dialog[open], input, textarea, select, [contenteditable="true"], .context-menu, .workspace-dock, .search-command')) return

  const activeIndex = store.workspaces.findIndex(workspace => workspace.id === store.activeWorkspaceId)
  const currentIndex = activeIndex >= 0 ? activeIndex : 0
  const direction = event.deltaY > 0 ? 1 : -1
  const nextIndex = (currentIndex + direction + store.workspaces.length) % store.workspaces.length
  const nextWorkspace = store.workspaces[nextIndex]
  if (!nextWorkspace) return

  workspaceWheelLocked = true
  selectWorkspace(nextWorkspace.id)
  workspaceWheelTimer = setTimeout(() => {
    workspaceWheelLocked = false
    workspaceWheelTimer = undefined
  }, 600)
}

async function addWorkspace() {
  const name = await promptDialog.value?.open({ title: '创建工作区', label: '工作区名称', placeholder: '例如：工作', confirmLabel: '创建工作区' })
  if (name) await store.mutate('/api/workspaces', { method: 'POST', body: { name } })
}

async function orderWorkspaces(ids: string[]) {
  if (ids.join(',') === store.workspaces.map(workspace => workspace.id).join(',')) return
  await store.mutate('/api/workspaces/order', { method: 'PUT', body: { ids } })
}

async function orderGroups(ids: string[]) {
  if (!activeWorkspace.value) return
  await store.mutate(`/api/workspaces/${activeWorkspace.value.id}/groups/order`, { method: 'PUT', body: { ids } })
}

async function orderLinks(groupId: string, ids: string[]) {
  const group = store.groupById(groupId)
  if (group?.links.map(link => link.id).join(',') === ids.join(',')) return
  await store.mutate(`/api/groups/${groupId}/links/order`, { method: 'PUT', body: { ids } })
}

async function moveLink(linkId: string, groupId: string, index: number) {
  await store.mutate(`/api/links/${linkId}/move`, { method: 'POST', body: { targetGroupId: groupId, targetIndex: index } })
}

function openEditor(groupId: string, link?: LinkItem) {
  const group = store.groupById(groupId) || activeWorkspace.value?.groups[0]
  if (group) editor.value?.open(group, link)
}

function openSettings() {
  settings.value?.open()
}

function showContextMenu(target: MenuTarget, x: number, y: number) {
  contextMenu.target = target
  contextMenu.x = x
  contextMenu.y = y
  contextMenu.open = true
}

function closeContextMenu() {
  contextMenu.open = false
  contextMenu.target = null
}

function showLinkMenu(request: { link: LinkItem; x: number; y: number }) {
  showContextMenu({ kind: 'link', link: request.link }, request.x, request.y)
}

function showWorkspaceMenu(request: { workspace: Workspace; x: number; y: number }) {
  showContextMenu({ kind: 'workspace', workspace: request.workspace }, request.x, request.y)
}

function showBackgroundMenu(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('input, textarea, select, [contenteditable="true"], dialog, button, a, .link-tile, .workspace-dock')) return
  event.preventDefault()
  showContextMenu({ kind: 'background' }, event.clientX, event.clientY)
}

async function renameWorkspace(workspace: Workspace) {
  const name = await promptDialog.value?.open({ title: '重命名工作区', label: '工作区名称', value: workspace.name, confirmLabel: '保存名称' })
  if (name && name !== workspace.name) await store.mutate(`/api/workspaces/${workspace.id}`, { method: 'PATCH', body: { name } })
}

async function removeWorkspace(workspace: Workspace) {
  const links = workspace.groups.reduce((total, group) => total + group.links.length, 0)
  const confirmed = await confirmDialog.value?.open({
    title: '删除工作区',
    message: `“${workspace.name}”中的 ${workspace.groups.length} 个分组和 ${links} 个标签都会被删除。`,
    confirmLabel: '删除工作区',
    danger: true
  })
  if (confirmed) await store.mutate(`/api/workspaces/${workspace.id}`, { method: 'DELETE' })
}

async function removeLink(link: LinkItem) {
  const confirmed = await confirmDialog.value?.open({
    title: '删除标签',
    message: `确定删除“${link.title}”吗？这个操作不能撤销。`,
    confirmLabel: '删除标签',
    danger: true
  })
  if (confirmed) await store.mutate(`/api/links/${link.id}`, { method: 'DELETE' })
}

function handleContextAction(id: string) {
  const target = contextMenu.target
  closeContextMenu()
  if (!target) return

  if (target.kind === 'link') {
    if (id === 'open-new-tab') window.open(target.link.url, '_blank', 'noopener')
    if (id === 'edit-link') openEditor(target.link.groupId, target.link)
    if (id === 'edit-icon') iconEditor.value?.open(target.link)
    if (id === 'delete-link') void removeLink(target.link)
    return
  }

  if (target.kind === 'workspace') {
    if (id === 'edit-workspace') void renameWorkspace(target.workspace)
    if (id === 'delete-workspace') void removeWorkspace(target.workspace)
    return
  }

  if (id === 'open-settings') settings.value?.open()
  if (id === 'add-link') openFirstAdd()
  if (id === 'edit-background') settings.value?.open('wallpaper')
}

function openFirstAdd() {
  const group = activeWorkspace.value?.groups[0]
  if (group) openEditor(group.id)
}

function onSettingsAdd(groupId: string) {
  settings.value?.close()
  openEditor(groupId)
}
</script>

<template>
  <main class="app-shell" :class="{ 'app-shell--paper': activePreferences.theme === 'paper' }" :style="appearanceStyle" @contextmenu="showBackgroundMenu" @wheel="onWheel">
    <AppBackground
      :wallpaper="activeWallpaper"
      :shader-enabled="Boolean(store.snapshot?.preferences.shaderEnabled)"
      :shader-intensity="store.snapshot?.preferences.shaderIntensity || 0.55"
    />

    <div class="app-content">
      <header class="topbar">
        <div class="topbar__brand"><span class="brand-mark brand-mark--small">O</span><span>ourTab</span><span class="topbar__slash">/</span><strong>{{ activeWorkspace?.name || '载入中' }}</strong></div>
        <div class="topbar__actions">
          <span class="sync-status" :class="{ syncing: store.syncing }"><i />{{ store.syncing ? '同步中' : '已同步' }}</span>
          <button class="icon-button" type="button" aria-label="打开设置" @click="openSettings"><Settings :size="18" /></button>
        </div>
      </header>

      <section class="hero-header" aria-labelledby="page-heading">
        <div class="hero-header__time"><span>{{ timeLabel }}</span><small>{{ dateLabel }}</small></div>
        <SearchCommand v-if="store.snapshot" :workspaces="store.workspaces" :preferences="activePreferences" />
        <p class="hero-header__hint"><Sparkles :size="13" /> 让常用的东西，回到它该在的位置</p>
      </section>

      <section v-if="store.loading && !store.snapshot" class="loading-state"><LoaderCircle class="spin" :size="24" /><span>正在整理你的桌面…</span></section>
      <section v-else-if="activeWorkspace" class="workspace-content" aria-live="polite">
        <VueDraggable v-model="localGroups" class="group-stack" item-key="id" handle=".link-group__marker" :animation="240" ghost-class="link-group--ghost" @end="orderGroups(localGroups.map(group => group.id))">
          <LinkGroupSection v-for="group in localGroups" :key="group.id" :group="group" :icon-size="activePreferences.iconSize" @add="openEditor" @menu="showLinkMenu" @order="orderLinks" @move="moveLink" />
        </VueDraggable>
        <button v-if="!localGroups.length" class="first-group-card" type="button" @click="openFirstAdd"><Plus :size="22" /><span>添加第一个网址</span><small>让你的常用入口从这里开始</small></button>
      </section>
      <section v-else class="empty-state"><div class="empty-state__orb" /><h1>还没有桌面</h1><p>创建一个工作区，开始收集你的入口。</p><button class="primary-button" type="button" @click="addWorkspace"><Plus :size="17" />创建工作区</button></section>

      <footer class="app-footer">
        <WorkspaceDock :workspaces="store.workspaces" :active-id="store.activeWorkspaceId" @select="selectWorkspace" @add="addWorkspace" @order="orderWorkspaces" @menu="showWorkspaceMenu" />
        <div class="app-footer__tip"><kbd>/</kbd> 搜索 <span>·</span> <kbd>⌘ K</kbd> 快速聚焦</div>
      </footer>
    </div>

    <div v-if="store.error" class="toast toast--error" role="status">{{ store.error }}<button type="button" aria-label="关闭提示" @click="store.error = ''">×</button></div>
    <LinkEditorDialog ref="editor" :groups="activeWorkspace?.groups || []" :default-open-mode="store.snapshot?.preferences.defaultOpenMode || 'current'" @saved="store.refresh({ quiet: true })" />
    <IconEditorDialog ref="iconEditor" @saved="store.refresh({ quiet: true })" />
    <SettingsPanel ref="settings" :active-workspace="activeWorkspace" :preferences="activePreferences" :wallpapers="store.snapshot?.wallpapers || []" @add-link="onSettingsAdd" />
    <AppContextMenu :open="contextMenu.open" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" @select="handleContextAction" />
    <AppPromptDialog ref="promptDialog" />
    <AppConfirmDialog ref="confirmDialog" />
  </main>
</template>
