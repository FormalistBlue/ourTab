<script setup lang="ts">
import { Image as ImageIcon, LayoutGrid, LogOut, Palette, Plus, Settings2, ShieldCheck, Trash2, Upload, X } from '@lucide/vue'
import type { AppPreferences, LinkGroup, Wallpaper, Workspace } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'
import type { ConfirmDialogApi, PromptDialogApi, SettingsSection } from '../types/ui'
import { versionedUploadUrl } from '../utils/assets'

const props = defineProps<{ activeWorkspace: Workspace | null; preferences: AppPreferences; wallpapers: Wallpaper[] }>()
const emit = defineEmits<{ close: []; addLink: [groupId: string] }>()
const store = useDashboardStore()
const { user, logout } = useAuth()
const dialog = ref<HTMLDialogElement | null>(null)
const promptDialog = ref<PromptDialogApi | null>(null)
const confirmDialog = ref<ConfirmDialogApi | null>(null)
const content = ref<HTMLElement | null>(null)
const section = ref<SettingsSection>('workspace')
const newWorkspaceName = ref('')
const newGroupName = ref('')
const uploading = ref(false)
const changingPassword = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const passwordMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const sectionMeta: Record<SettingsSection, { label: string; kicker: string; description: string }> = {
  workspace: { label: '工作区', kicker: 'WORKSPACE', description: '管理桌面、分组和顺序' },
  appearance: { label: '视觉', kicker: 'APPEARANCE', description: '控制标签和动态氛围' },
  wallpaper: { label: '壁纸', kicker: 'WALLPAPER', description: '选择或删除上传背景' },
  account: { label: '账号安全', kicker: 'ACCOUNT', description: '密码和登录状态' }
}

const currentSection = computed(() => sectionMeta[section.value])

function open(nextSection: SettingsSection = 'workspace') {
  section.value = nextSection
  if (!dialog.value?.open) dialog.value?.showModal()
  nextTick(() => { if (content.value) content.value.scrollTop = 0 })
}

function close() {
  if (dialog.value?.open) dialog.value.close()
  emit('close')
}

function selectSection(nextSection: SettingsSection) {
  section.value = nextSection
  if (content.value) content.value.scrollTop = 0
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
  if (confirmed) await store.mutate(`/api/workspaces/${workspace.id}`, { method: 'DELETE' })
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
  if (confirmed) await store.mutate(`/api/groups/${group.id}`, { method: 'DELETE' })
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

async function removeWallpaper(wallpaper: Wallpaper) {
  if (wallpaper.kind !== 'upload') return
  const confirmed = await confirmDialog.value?.open({
    title: '删除上传壁纸',
    message: `确定删除“${wallpaper.name}”吗？使用它的工作区会回退到全局背景。`,
    confirmLabel: '删除壁纸',
    danger: true
  })
  if (confirmed) await store.mutate(`/api/wallpapers/${wallpaper.id}`, { method: 'DELETE' })
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
  <dialog ref="dialog" class="settings-dialog" @cancel.prevent="close" @click.self="close">
    <aside class="settings-panel">
      <nav class="settings-panel__nav" aria-label="设置分类">
        <div class="settings-nav__brand"><span class="brand-mark brand-mark--small">O</span><div><p class="eyebrow">CONTROL ROOM</p><strong>设置</strong></div></div>
        <div class="settings-nav__list" role="tablist" aria-label="设置分类">
          <button class="settings-nav__item" :class="{ active: section === 'workspace' }" type="button" role="tab" :aria-selected="section === 'workspace'" @click="selectSection('workspace')"><LayoutGrid :size="17" /><span><strong>工作区</strong><small>桌面与分组</small></span></button>
          <button class="settings-nav__item" :class="{ active: section === 'appearance' }" type="button" role="tab" :aria-selected="section === 'appearance'" @click="selectSection('appearance')"><Palette :size="17" /><span><strong>视觉</strong><small>搜索与动态效果</small></span></button>
          <button class="settings-nav__item" :class="{ active: section === 'wallpaper' }" type="button" role="tab" :aria-selected="section === 'wallpaper'" @click="selectSection('wallpaper')"><ImageIcon :size="17" /><span><strong>壁纸</strong><small>背景与上传文件</small></span></button>
          <button class="settings-nav__item" :class="{ active: section === 'account' }" type="button" role="tab" :aria-selected="section === 'account'" @click="selectSection('account')"><ShieldCheck :size="17" /><span><strong>账号安全</strong><small>密码与会话</small></span></button>
        </div>
        <span class="settings-nav__version">ourTab · v1.1</span>
      </nav>

      <section class="settings-panel__content" role="tabpanel">
        <header class="settings-panel__header">
          <div><p class="eyebrow">{{ currentSection.kicker }}</p><h2><Settings2 :size="20" />{{ currentSection.label }}</h2><p class="settings-panel__subtitle">{{ currentSection.description }}</p></div>
          <button class="icon-button" type="button" aria-label="关闭设置" @click="close"><X :size="19" /></button>
        </header>

        <div ref="content" class="settings-panel__body">
          <section v-if="section === 'workspace'" class="settings-section settings-section--first">
            <div v-if="activeWorkspace" class="workspace-setting-row">
              <div><strong>{{ activeWorkspace.name }}</strong><small>{{ activeWorkspace.groups.length }} 个分组</small></div>
              <div class="row-actions"><button class="text-button" type="button" @click="renameWorkspace(activeWorkspace)">重命名</button><button class="danger-text-button" type="button" aria-label="删除当前工作区" @click="removeWorkspace(activeWorkspace)"><Trash2 :size="14" /></button></div>
            </div>
            <div class="inline-create"><input v-model="newWorkspaceName" placeholder="新工作区名称" @keyup.enter="createWorkspace"><button class="icon-button icon-button--accent" type="button" aria-label="添加工作区" @click="createWorkspace"><Plus :size="17" /></button></div>
            <div class="workspace-setting-row workspace-setting-row--group">
              <div><strong>新增分组</strong><small>让网址保持轻盈有序</small></div>
              <div class="inline-create inline-create--small"><input v-model="newGroupName" placeholder="分组名称" @keyup.enter="createGroup"><button class="icon-button icon-button--accent" type="button" aria-label="添加分组" @click="createGroup"><Plus :size="17" /></button></div>
            </div>
            <div v-if="activeWorkspace" class="group-list">
              <div v-for="group in activeWorkspace.groups" :key="group.id" class="group-list__item"><span>{{ group.name }} <small>{{ group.links.length }}</small></span><span><button class="text-button" type="button" @click="emit('addLink', group.id)">添加</button><button class="text-button" type="button" @click="renameGroup(group)">改名</button><button class="danger-text-button" type="button" :aria-label="`删除分组 ${group.name}`" @click="removeGroup(group)"><Trash2 :size="13" /></button></span></div>
            </div>
          </section>

          <section v-else-if="section === 'appearance'" class="settings-section settings-section--first">
            <label class="setting-control"><span>默认搜索引擎</span><select :value="preferences.searchEngine" @change="updatePreference({ searchEngine: ($event.target as HTMLSelectElement).value as AppPreferences['searchEngine'] })"><option value="google">Google</option><option value="bing">Bing</option><option value="baidu">百度</option></select></label>
            <label class="setting-control"><span>标签默认打开方式</span><select :value="preferences.defaultOpenMode" @change="updatePreference({ defaultOpenMode: ($event.target as HTMLSelectElement).value as AppPreferences['defaultOpenMode'] })"><option value="current">当前标签页</option><option value="new-tab">新标签页</option></select></label>
            <label class="setting-control"><span>标签尺寸 <small>{{ preferences.iconSize }}px</small></span><input type="range" min="48" max="88" step="4" :value="preferences.iconSize" @change="updatePreference({ iconSize: Number(($event.target as HTMLInputElement).value) })"></label>
            <label class="setting-toggle"><span><strong>雾光流域</strong><small>启用 WebGL2 动态氛围</small></span><input type="checkbox" :checked="preferences.shaderEnabled" @change="updatePreference({ shaderEnabled: ($event.target as HTMLInputElement).checked })"><i /></label>
            <label v-if="preferences.shaderEnabled" class="setting-control"><span>动态强度 <small>{{ Math.round(preferences.shaderIntensity * 100) }}%</small></span><input type="range" min="0" max="1" step="0.05" :value="preferences.shaderIntensity" @change="updatePreference({ shaderIntensity: Number(($event.target as HTMLInputElement).value) })"></label>
          </section>

          <section v-else-if="section === 'wallpaper'" class="settings-section settings-section--first">
            <div class="settings-section__intro"><div><strong>背景图库</strong><small>点击卡片应用全局背景，上传的壁纸可以随时删除。</small></div><button class="quiet-button" type="button" :disabled="uploading" @click="fileInput?.click()"><Upload :size="15" />{{ uploading ? '处理中' : '上传壁纸' }}</button><input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="uploadWallpaper"></div>
            <div class="wallpaper-grid">
              <article v-for="wallpaper in wallpapers" :key="wallpaper.id" class="wallpaper-card" :class="{ active: preferences.globalWallpaperId === wallpaper.id }">
                <button class="wallpaper-card__select" type="button" :aria-label="`使用壁纸 ${wallpaper.name}`" @click="updatePreference({ globalWallpaperId: wallpaper.id })"><span v-if="wallpaper.thumbnailPath" class="wallpaper-card__image" :style="{ backgroundImage: `url(${versionedUploadUrl(wallpaper.thumbnailPath, wallpaper.createdAt)})` }" /><span v-else class="wallpaper-card__image wallpaper-card__image--mist" :class="{ 'wallpaper-card__image--shader': wallpaper.kind === 'shader' }" /><strong>{{ wallpaper.name }}</strong></button>
                <button v-if="wallpaper.kind === 'upload'" class="wallpaper-card__delete" type="button" :aria-label="`删除壁纸 ${wallpaper.name}`" title="删除上传壁纸" @click="removeWallpaper(wallpaper)"><Trash2 :size="14" /></button>
              </article>
            </div>
          </section>

          <section v-else class="settings-section settings-section--first">
            <form class="password-form" @submit.prevent="changePassword"><input v-model="currentPassword" type="password" placeholder="当前密码" autocomplete="current-password" required><input v-model="newPassword" type="password" placeholder="新密码（至少 12 位）" minlength="12" autocomplete="new-password" required><button class="quiet-button" type="submit" :disabled="changingPassword">{{ changingPassword ? '更新中…' : '更新密码' }}</button><small v-if="passwordMessage" role="alert">{{ passwordMessage }}</small></form>
            <div class="account-note"><ShieldCheck :size="17" /><span>修改密码后当前会话会立即失效，需要重新登录。</span></div>
          </section>
        </div>

        <footer class="settings-panel__footer"><button class="logout-button" type="button" @click="logout"><LogOut :size="16" />退出登录</button><span>数据保存在你的服务器上</span></footer>
      </section>
    </aside>
  </dialog>
  <AppPromptDialog ref="promptDialog" />
  <AppConfirmDialog ref="confirmDialog" />
</template>
