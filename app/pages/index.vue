<script setup lang="ts">
import { LoaderCircle, Plus, Settings, Sparkles } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { LinkGroup, LinkItem } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'

const store = useDashboardStore()
const editor = ref<{ open: (group: LinkGroup, link?: LinkItem) => void } | null>(null)
const settings = ref<{ open: () => void; close: () => void } | null>(null)
const localGroups = ref<LinkGroup[]>([])
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | undefined

const activeWorkspace = computed(() => store.activeWorkspace)
const activeWallpaper = computed(() => {
  const workspaceWallpaper = activeWorkspace.value?.wallpaperId
  const wallpaperId = workspaceWallpaper || store.snapshot?.preferences.globalWallpaperId
  return store.snapshot?.wallpapers.find(wallpaper => wallpaper.id === wallpaperId) || null
})
const dateLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }).format(now.value))
const timeLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now.value))

watch(activeWorkspace, workspace => { localGroups.value = workspace ? [...workspace.groups] : [] }, { immediate: true, deep: true })

onMounted(async () => {
  await store.hydrate()
  await store.refresh()
  clockTimer = setInterval(() => { now.value = new Date() }, 30_000)
  document.addEventListener('visibilitychange', refreshOnVisible)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
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

async function addWorkspace() {
  const name = window.prompt('工作区名称')?.trim()
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
  <main class="app-shell">
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
        <SearchCommand v-if="store.snapshot" :workspaces="store.workspaces" :preferences="store.snapshot.preferences" />
        <p class="hero-header__hint"><Sparkles :size="13" /> 让常用的东西，回到它该在的位置</p>
      </section>

      <section v-if="store.loading && !store.snapshot" class="loading-state"><LoaderCircle class="spin" :size="24" /><span>正在整理你的桌面…</span></section>
      <section v-else-if="activeWorkspace" class="workspace-content" aria-live="polite">
        <VueDraggable v-model="localGroups" class="group-stack" item-key="id" handle=".link-group__marker" :animation="240" ghost-class="link-group--ghost" @end="orderGroups(localGroups.map(group => group.id))">
          <LinkGroupSection v-for="group in localGroups" :key="group.id" :group="group" :icon-size="store.snapshot?.preferences.iconSize || 64" @add="openEditor" @edit="openEditor($event.groupId, $event)" @order="orderLinks" @move="moveLink" />
        </VueDraggable>
        <button v-if="!localGroups.length" class="first-group-card" type="button" @click="openFirstAdd"><Plus :size="22" /><span>添加第一个网址</span><small>让你的常用入口从这里开始</small></button>
      </section>
      <section v-else class="empty-state"><div class="empty-state__orb" /><h1>还没有桌面</h1><p>创建一个工作区，开始收集你的入口。</p><button class="primary-button" type="button" @click="addWorkspace"><Plus :size="17" />创建工作区</button></section>

      <footer class="app-footer">
        <WorkspaceDock :workspaces="store.workspaces" :active-id="store.activeWorkspaceId" @select="selectWorkspace" @add="addWorkspace" @order="orderWorkspaces" />
        <div class="app-footer__tip"><kbd>/</kbd> 搜索 <span>·</span> <kbd>⌘ K</kbd> 快速聚焦</div>
      </footer>
    </div>

    <div v-if="store.error" class="toast toast--error" role="status">{{ store.error }}<button type="button" aria-label="关闭提示" @click="store.error = ''">×</button></div>
    <LinkEditorDialog ref="editor" :groups="activeWorkspace?.groups || []" @saved="store.refresh({ quiet: true })" />
    <SettingsPanel ref="settings" :active-workspace="activeWorkspace" :preferences="store.snapshot?.preferences || { searchEngine: 'google', defaultOpenMode: 'current', globalWallpaperId: null, shaderEnabled: false, shaderIntensity: .55, iconSize: 64 }" :wallpapers="store.snapshot?.wallpapers || []" @add-link="onSettingsAdd" />
  </main>
</template>
