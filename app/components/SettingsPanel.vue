<script setup lang="ts">
import { LogOut, Plus, Settings2, Trash2, Upload, X } from '@lucide/vue'
import type { AppPreferences, LinkGroup, Workspace } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'
import type { ConfirmDialogApi, PromptDialogApi } from '../types/ui'

const props = defineProps<{ activeWorkspace: Workspace | null; preferences: AppPreferences; wallpapers: { id: string; name: string; kind: string; imagePath: string | null; thumbnailPath: string | null }[] }>()
const emit = defineEmits<{ close: []; addLink: [groupId: string] }>()
const store = useDashboardStore()
const { user, logout } = useAuth()
const dialog = ref<HTMLDialogElement | null>(null)
const promptDialog = ref<PromptDialogApi | null>(null)
const confirmDialog = ref<ConfirmDialogApi | null>(null)
const wallpaperSection = ref<HTMLElement | null>(null)
const newWorkspaceName = ref('')
const newGroupName = ref('')
const uploading = ref(false)
const changingPassword = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const passwordMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function open(section?: 'wallpaper') {
  if (!dialog.value?.open) dialog.value?.showModal()
  if (section === 'wallpaper') nextTick(() => wallpaperSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function close() {
  dialog.value?.close()
  emit('close')
}

async function updatePreference(value: Partial<AppPreferences>) {
  await store.mutate('/api/preferences', { method: 'PATCH', body: value })
}

async function createWorkspace() {
  if (!newWorkspaceName.value.trim()) return
  await store.mutate('/api/workspaces', { method: 'POST', body: { name: newWorkspaceName.value } })
  newWorkspaceName.value = ''
}

async function renameWorkspace(workspace: Workspace) {
  const name = await promptDialog.value?.open({ title: '重命名工作区', label: '工作区名称', value: workspace.name, confirmLabel: '保存名称' })
  if (name && name !== workspace.name) await store.mutate(`/api/workspaces/${workspace.id}`, { method: 'PATCH', body: { name } })
}

async function removeWorkspace(workspace: Workspace) {
  const linkCount = workspace.groups.reduce((total, group) => total + group.links.length, 0)
  const confirmed = await confirmDialog.value?.open({
    title: '删除工作区',
    message: `“${workspace.name}”中的 ${workspace.groups.length} 个分组和 ${linkCount} 个标签都会被删除。`,
    confirmLabel: '删除工作区',
    danger: true
  })
  if (!confirmed) return
  await store.mutate(`/api/workspaces/${workspace.id}`, { method: 'DELETE' })
}

async function createGroup() {
  if (!newGroupName.value.trim() || !props.activeWorkspace) return
  await store.mutate('/api/groups', { method: 'POST', body: { workspaceId: props.activeWorkspace.id, name: newGroupName.value } })
  newGroupName.value = ''
}

async function renameGroup(group: LinkGroup) {
  const name = await promptDialog.value?.open({ title: '重命名分组', label: '分组名称', value: group.name, confirmLabel: '保存名称' })
  if (name && name !== group.name) await store.mutate(`/api/groups/${group.id}`, { method: 'PATCH', body: { name } })
}

async function removeGroup(group: LinkGroup) {
  const confirmed = await confirmDialog.value?.open({
    title: '删除分组',
    message: group.links.length ? `“${group.name}”及其中 ${group.links.length} 个标签都会被删除。` : `确定删除空分组“${group.name}”吗？`,
    confirmLabel: '删除分组',
    danger: true
  })
  if (!confirmed) return
  await store.mutate(`/api/groups/${group.id}`, { method: 'DELETE' })
}

async function uploadWallpaper(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('name', file.name.replace(/\.[^.]+$/, '').slice(0, 40))
    await store.mutate('/api/wallpapers', { method: 'POST', body })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function changePassword() {
  changingPassword.value = true
  passwordMessage.value = ''
  try {
    await $fetch('/api/auth/password', { method: 'PATCH', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } })
    currentPassword.value = ''
    newPassword.value = ''
    await store.reset()
    user.value = null
    close()
    await navigateTo('/login')
  } catch (cause) {
    const candidate = cause as { data?: { statusMessage?: string } }
    passwordMessage.value = candidate.data?.statusMessage || '密码更新失败'
  } finally {
    changingPassword.value = false
  }
}

defineExpose({ open, close })
</script>

<template>
  <dialog ref="dialog" class="settings-dialog" @click.self="close">
    <aside class="settings-panel">
      <header class="settings-panel__header">
        <div><p class="eyebrow">CONTROL ROOM</p><h2><Settings2 :size="20" /> 设置</h2></div>
        <button class="icon-button" type="button" aria-label="关闭设置" @click="close"><X :size="19" /></button>
      </header>

      <div class="settings-panel__body">
        <section class="settings-section">
          <div class="settings-section__heading"><div><span class="settings-section__kicker">WORKSPACE</span><h3>当前工作区</h3></div></div>
          <div v-if="activeWorkspace" class="workspace-setting-row">
            <div><strong>{{ activeWorkspace.name }}</strong><small>{{ activeWorkspace.groups.length }} 个分组</small></div>
            <div class="row-actions"><button class="text-button" type="button" @click="renameWorkspace(activeWorkspace)">重命名</button><button class="danger-text-button" type="button" @click="removeWorkspace(activeWorkspace)"><Trash2 :size="14" /></button></div>
          </div>
          <div class="inline-create"><input v-model="newWorkspaceName" placeholder="新工作区名称" @keyup.enter="createWorkspace"><button class="icon-button icon-button--accent" type="button" aria-label="添加工作区" @click="createWorkspace"><Plus :size="17" /></button></div>
          <div class="workspace-setting-row workspace-setting-row--group">
            <div><strong>新增分组</strong><small>让网址保持轻盈有序</small></div>
            <div class="inline-create inline-create--small"><input v-model="newGroupName" placeholder="分组名称" @keyup.enter="createGroup"><button class="icon-button icon-button--accent" type="button" aria-label="添加分组" @click="createGroup"><Plus :size="17" /></button></div>
          </div>
          <div v-if="activeWorkspace" class="group-list">
            <div v-for="group in activeWorkspace.groups" :key="group.id" class="group-list__item"><span>{{ group.name }} <small>{{ group.links.length }}</small></span><span><button class="text-button" type="button" @click="emit('addLink', group.id)">添加</button><button class="text-button" type="button" @click="renameGroup(group)">改名</button><button class="danger-text-button" type="button" @click="removeGroup(group)"><Trash2 :size="13" /></button></span></div>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section__heading"><div><span class="settings-section__kicker">APPEARANCE</span><h3>视觉</h3></div></div>
          <label class="setting-control"><span>默认搜索引擎</span><select :value="preferences.searchEngine" @change="updatePreference({ searchEngine: ($event.target as HTMLSelectElement).value as AppPreferences['searchEngine'] })"><option value="google">Google</option><option value="bing">Bing</option><option value="baidu">百度</option></select></label>
          <label class="setting-control"><span>标签默认打开方式</span><select :value="preferences.defaultOpenMode" @change="updatePreference({ defaultOpenMode: ($event.target as HTMLSelectElement).value as AppPreferences['defaultOpenMode'] })"><option value="current">当前标签页</option><option value="new-tab">新标签页</option></select></label>
          <label class="setting-control"><span>标签尺寸 <small>{{ preferences.iconSize }}px</small></span><input type="range" min="48" max="88" step="4" :value="preferences.iconSize" @change="updatePreference({ iconSize: Number(($event.target as HTMLInputElement).value) })"></label>
          <label class="setting-toggle"><span><strong>雾光流域</strong><small>启用 WebGL2 动态氛围</small></span><input type="checkbox" :checked="preferences.shaderEnabled" @change="updatePreference({ shaderEnabled: ($event.target as HTMLInputElement).checked })"><i /></label>
          <label v-if="preferences.shaderEnabled" class="setting-control"><span>动态强度 <small>{{ Math.round(preferences.shaderIntensity * 100) }}%</small></span><input type="range" min="0" max="1" step="0.05" :value="preferences.shaderIntensity" @change="updatePreference({ shaderIntensity: Number(($event.target as HTMLInputElement).value) })"></label>
        </section>

        <section ref="wallpaperSection" class="settings-section">
          <div class="settings-section__heading"><div><span class="settings-section__kicker">WALLPAPER</span><h3>壁纸</h3></div><button class="quiet-button" type="button" :disabled="uploading" @click="fileInput?.click()"><Upload :size="15" />上传</button><input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="uploadWallpaper"></div>
          <div class="wallpaper-grid">
            <button v-for="wallpaper in wallpapers" :key="wallpaper.id" class="wallpaper-card" :class="{ active: preferences.globalWallpaperId === wallpaper.id }" type="button" @click="updatePreference({ globalWallpaperId: wallpaper.id })">
              <span v-if="wallpaper.thumbnailPath" class="wallpaper-card__image" :style="{ backgroundImage: `url(${wallpaper.thumbnailPath})` }" /><span v-else class="wallpaper-card__image wallpaper-card__image--mist" :class="{ 'wallpaper-card__image--shader': wallpaper.kind === 'shader' }" /><strong>{{ wallpaper.name }}</strong>
            </button>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section__heading"><div><span class="settings-section__kicker">ACCOUNT</span><h3>账号安全</h3></div></div>
          <form class="password-form" @submit.prevent="changePassword"><input v-model="currentPassword" type="password" placeholder="当前密码" autocomplete="current-password" required><input v-model="newPassword" type="password" placeholder="新密码（至少 12 位）" minlength="12" autocomplete="new-password" required><button class="quiet-button" type="submit" :disabled="changingPassword">{{ changingPassword ? '更新中…' : '更新密码' }}</button><small v-if="passwordMessage">{{ passwordMessage }}</small></form>
        </section>
      </div>

      <footer class="settings-panel__footer"><button class="logout-button" type="button" @click="logout"><LogOut :size="16" />退出登录</button><span>ourTab · v1.1</span></footer>
    </aside>
  </dialog>
  <AppPromptDialog ref="promptDialog" />
  <AppConfirmDialog ref="confirmDialog" />
</template>
