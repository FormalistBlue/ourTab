<script setup lang="ts">
import { Check, Image as ImageIcon, LoaderCircle, Trash2, Type, Upload, X } from '@lucide/vue'
import type { LinkGroup, LinkItem, LinkMetadata, OpenMode } from '#shared/contracts'
import { uploadLinkIcon } from '../composables/uploadLinkIcon'
import { useDashboardStore } from '../stores/dashboard'
import type { ConfirmDialogApi } from '../types/ui'

const props = defineProps<{ groups: LinkGroup[]; defaultOpenMode: OpenMode }>()
const emit = defineEmits<{ saved: []; closed: [] }>()
const store = useDashboardStore()
const dialog = ref<HTMLDialogElement | null>(null)
const confirmDialog = ref<ConfirmDialogApi | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const editing = ref<LinkItem | null>(null)
const groupId = ref('')
const title = ref('')
const url = ref('')
const iconPath = ref<string | null>(null)
const iconColor = ref('#d6a85f')
const openMode = ref<OpenMode>('current')
const pendingIconFile = ref<File | null>(null)
const iconPreviewUrl = ref<string | null>(null)
const resolving = ref(false)
const saving = ref(false)
const error = ref('')
const iconColorTouched = ref(false)
let metadataRequestId = 0

const currentGroup = computed(() => props.groups.find(group => group.id === groupId.value))
const initial = computed(() => title.value.trim().slice(0, 1).toUpperCase() || '?')
const iconPreviewPath = computed(() => iconPreviewUrl.value || iconPath.value)

function revokeIconPreview() {
  if (iconPreviewUrl.value) URL.revokeObjectURL(iconPreviewUrl.value)
  iconPreviewUrl.value = null
}

function open(group: LinkGroup, link?: LinkItem) {
  metadataRequestId += 1
  revokeIconPreview()
  editing.value = link || null
  groupId.value = link?.groupId || group.id
  title.value = link?.title || ''
  url.value = link?.url || ''
  iconPath.value = link?.iconPath || null
  iconColor.value = link?.iconColor || '#d6a85f'
  openMode.value = link?.openMode || props.defaultOpenMode
  pendingIconFile.value = null
  iconColorTouched.value = false
  if (fileInput.value) fileInput.value.value = ''
  error.value = ''
  dialog.value?.showModal()
  nextTick(() => dialog.value?.querySelector<HTMLInputElement>('input')?.focus())
}

function close() {
  metadataRequestId += 1
  if (dialog.value?.open) dialog.value.close()
  revokeIconPreview()
  pendingIconFile.value = null
  emit('closed')
}

function selectIconFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    error.value = '图标不能超过 3MB'
    input.value = ''
    return
  }
  metadataRequestId += 1
  resolving.value = false
  revokeIconPreview()
  pendingIconFile.value = file
  iconPreviewUrl.value = URL.createObjectURL(file)
  error.value = ''
}

function useInitialIcon() {
  metadataRequestId += 1
  resolving.value = false
  revokeIconPreview()
  pendingIconFile.value = null
  iconPath.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function resolveMetadata() {
  if (!url.value.trim()) return
  const requestId = ++metadataRequestId
  resolving.value = true
  error.value = ''
  try {
    const metadata = await $fetch<LinkMetadata>('/api/link-metadata/resolve', {
      method: 'POST',
      body: { url: url.value }
    })
    if (requestId !== metadataRequestId) return
    url.value = metadata.normalizedUrl
    if (!title.value && metadata.title) title.value = metadata.title
    revokeIconPreview()
    pendingIconFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    iconPath.value = metadata.iconPath
    iconColor.value = metadata.iconColor
    iconColorTouched.value = false
  } catch (cause) {
    if (requestId === metadataRequestId) error.value = getErrorMessage(cause)
  } finally {
    if (requestId === metadataRequestId) resolving.value = false
  }
}

async function save() {
  if (!title.value.trim() || !url.value.trim() || !groupId.value) {
    error.value = '请填写名称、网址并选择分组'
    return
  }
  saving.value = true
  error.value = ''
  try {
    let nextIconPath = iconPath.value
    let nextIconColor = iconColor.value
    if (pendingIconFile.value) {
      const uploaded = await uploadLinkIcon(pendingIconFile.value)
      nextIconPath = uploaded.iconPath
      if (!iconColorTouched.value) nextIconColor = uploaded.iconColor
    }
    if (editing.value) {
      await store.mutate(`/api/links/${editing.value.id}`, {
        method: 'PATCH',
        body: { title: title.value, url: url.value, iconPath: nextIconPath, iconColor: nextIconColor, openMode: openMode.value }
      })
      if (editing.value.groupId !== groupId.value) {
        await store.mutate(`/api/links/${editing.value.id}/move`, {
          method: 'POST',
          body: { targetGroupId: groupId.value, targetIndex: currentGroup.value?.links.length || 0 }
        })
      }
    } else {
      await store.mutate('/api/links', {
        method: 'POST',
        body: { groupId: groupId.value, title: title.value, url: url.value, iconPath: nextIconPath, iconColor: nextIconColor, openMode: openMode.value }
      })
    }
    emit('saved')
    close()
  } catch (cause) {
    error.value = getErrorMessage(cause)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!editing.value) return
  const confirmed = await confirmDialog.value?.open({
    title: '删除标签',
    message: `确定删除“${editing.value.title}”吗？这个操作不能撤销。`,
    confirmLabel: '删除标签',
    danger: true
  })
  if (!confirmed) return
  saving.value = true
  try {
    await store.mutate(`/api/links/${editing.value.id}`, { method: 'DELETE' })
    emit('saved')
    close()
  } catch (cause) {
    error.value = getErrorMessage(cause)
  } finally {
    saving.value = false
  }
}

function getErrorMessage(error: unknown) {
  const candidate = error as { data?: { statusMessage?: string }; message?: string }
  return candidate?.data?.statusMessage || candidate?.message || '操作失败'
}

onBeforeUnmount(revokeIconPreview)
defineExpose({ open, close })
</script>

<template>
  <dialog ref="dialog" class="modal-dialog" @cancel.prevent="close" @click.self="close">
    <form class="modal-card" @submit.prevent="save">
      <header class="modal-card__header">
        <div>
          <p class="eyebrow">{{ editing ? 'EDIT LINK' : 'NEW LINK' }}</p>
          <h2>{{ editing ? '编辑网址标签' : '添加网址标签' }}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="关闭" @click="close"><X :size="19" /></button>
      </header>

      <div class="modal-card__body">
        <label class="field-label">
          <span>网址</span>
          <div class="field-with-action">
            <input v-model="url" type="url" placeholder="example.com" required @blur="resolveMetadata">
            <button class="inline-button" type="button" :disabled="resolving" @click="resolveMetadata">
              <LoaderCircle v-if="resolving" class="spin" :size="15" />
              <span v-else>识别</span>
            </button>
          </div>
        </label>
        <label class="field-label">
          <span>名称</span>
          <input v-model="title" maxlength="80" placeholder="例如：GitHub" required>
        </label>
        <div class="form-grid">
          <label class="field-label">
            <span>分组</span>
            <select v-model="groupId" required>
              <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
          </label>
          <label class="field-label">
            <span>打开方式</span>
            <select v-model="openMode">
              <option value="current">当前标签页</option>
              <option value="new-tab">新标签页</option>
            </select>
          </label>
        </div>
        <div class="link-icon-editor">
          <span class="link-icon link-icon--editor-small" :style="{ '--icon-color': iconColor }">
            <img v-if="iconPreviewPath" :src="iconPreviewPath" alt="图标预览">
            <span v-else>{{ initial }}</span>
          </span>
          <div class="link-icon-editor__copy"><strong>标签图标</strong><small>自动识别，也可以上传自己的图片</small></div>
          <button class="quiet-button" type="button" @click="fileInput?.click()"><Upload :size="15" />上传</button>
          <button class="icon-button icon-button--micro" type="button" aria-label="使用首字母图标" title="使用首字母" @click="useInitialIcon"><Type :size="14" /></button>
          <input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="selectIconFile">
        </div>
        <label class="icon-color-control icon-color-control--compact">
          <span><ImageIcon :size="15" /><span>图标主题色<small>用于边框和背景光晕</small></span></span>
          <input v-model="iconColor" type="color" aria-label="图标主题色" @input="iconColorTouched = true">
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      </div>

      <footer class="modal-card__footer">
        <button v-if="editing" class="danger-button" type="button" :disabled="saving" @click="remove"><Trash2 :size="15" /> 删除</button>
        <span class="modal-card__spacer" />
        <button class="quiet-button" type="button" @click="close">取消</button>
        <button class="primary-button primary-button--compact" type="submit" :disabled="saving">
          <Check :size="16" />{{ saving ? '保存中' : '保存标签' }}
        </button>
      </footer>
    </form>
  </dialog>
  <AppConfirmDialog ref="confirmDialog" />
</template>
