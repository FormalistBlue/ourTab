<script setup lang="ts">
import { Check, Image as ImageIcon, LoaderCircle, RefreshCw, Type, Upload, X } from '@lucide/vue'
import type { LinkItem, LinkMetadata } from '#shared/contracts'
import { uploadLinkIcon } from '../composables/uploadLinkIcon'
import { useDashboardStore } from '../stores/dashboard'

const emit = defineEmits<{ saved: []; closed: [] }>()
const store = useDashboardStore()
const dialog = ref<HTMLDialogElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const editing = ref<LinkItem | null>(null)
const iconPath = ref<string | null>(null)
const iconColor = ref('#d6a85f')
const pendingFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const saving = ref(false)
const resolving = ref(false)
const error = ref('')
const iconColorTouched = ref(false)
let metadataRequestId = 0

const initial = computed(() => editing.value?.title.trim().slice(0, 1).toUpperCase() || '?')
const previewPath = computed(() => previewUrl.value || iconPath.value)

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function open(link: LinkItem) {
  metadataRequestId += 1
  revokePreview()
  editing.value = link
  iconPath.value = link.iconPath
  iconColor.value = link.iconColor
  pendingFile.value = null
  iconColorTouched.value = false
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
  dialog.value?.showModal()
}

function close() {
  metadataRequestId += 1
  if (dialog.value?.open) dialog.value.close()
  revokePreview()
  pendingFile.value = null
  emit('closed')
}

function selectFile(event: Event) {
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
  revokePreview()
  pendingFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  error.value = ''
}

function useInitial() {
  metadataRequestId += 1
  resolving.value = false
  revokePreview()
  pendingFile.value = null
  iconPath.value = null
  if (fileInput.value) fileInput.value.value = ''
  error.value = ''
}

async function resolveSiteIcon() {
  if (!editing.value) return
  const requestId = ++metadataRequestId
  resolving.value = true
  error.value = ''
  try {
    const metadata = await $fetch<LinkMetadata>('/api/link-metadata/resolve', {
      method: 'POST',
      body: { url: editing.value.url }
    })
    if (requestId !== metadataRequestId) return
    revokePreview()
    pendingFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    iconPath.value = metadata.iconPath
    iconColor.value = metadata.iconColor
    iconColorTouched.value = false
    if (!metadata.iconPath) error.value = '没有识别到网站图标，将使用首字母样式。'
  } catch (cause) {
    if (requestId === metadataRequestId) error.value = getErrorMessage(cause)
  } finally {
    if (requestId === metadataRequestId) resolving.value = false
  }
}

async function save() {
  if (!editing.value) return
  saving.value = true
  error.value = ''
  try {
    let nextPath = iconPath.value
    let nextColor = iconColor.value
    if (pendingFile.value) {
      const uploaded = await uploadLinkIcon(pendingFile.value)
      nextPath = uploaded.iconPath
      if (!iconColorTouched.value) nextColor = uploaded.iconColor
    }
    await store.mutate(`/api/links/${editing.value.id}`, {
      method: 'PATCH',
      body: { iconPath: nextPath, iconColor: nextColor }
    })
    emit('saved')
    close()
  } catch (cause) {
    error.value = getErrorMessage(cause)
  } finally {
    saving.value = false
  }
}

function getErrorMessage(cause: unknown) {
  const candidate = cause as { data?: { statusMessage?: string }; message?: string }
  return candidate.data?.statusMessage || candidate.message || '图标保存失败'
}

onBeforeUnmount(revokePreview)
defineExpose({ open, close })
</script>

<template>
  <dialog ref="dialog" class="modal-dialog" @cancel.prevent="close" @click.self="close">
    <form class="modal-card" @submit.prevent="save">
      <header class="modal-card__header">
        <div><p class="eyebrow">CUSTOM ICON</p><h2>编辑“{{ editing?.title }}”的图标</h2></div>
        <button class="icon-button" type="button" aria-label="关闭" @click="close"><X :size="19" /></button>
      </header>

      <div class="modal-card__body">
        <div class="icon-editor-hero">
          <span class="link-icon link-icon--editor" :style="{ '--icon-color': iconColor }">
            <img v-if="previewPath" :src="previewPath" alt="图标预览">
            <span v-else>{{ initial }}</span>
          </span>
          <div><strong>图标预览</strong><small>建议使用正方形 PNG、WebP 或 AVIF，最大 3MB。</small></div>
        </div>

        <div class="icon-editor-actions">
          <button class="quiet-button icon-choice" type="button" @click="fileInput?.click()"><Upload :size="16" /><span>上传图片<small>使用自己的图标</small></span></button>
          <button class="quiet-button icon-choice" type="button" :disabled="resolving" @click="resolveSiteIcon">
            <LoaderCircle v-if="resolving" class="spin" :size="16" /><RefreshCw v-else :size="16" />
            <span>网站图标<small>重新自动识别</small></span>
          </button>
          <button class="quiet-button icon-choice" type="button" @click="useInitial"><Type :size="16" /><span>首字母<small>清除图片图标</small></span></button>
          <input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="selectFile">
        </div>

        <label class="icon-color-control">
          <span><ImageIcon :size="16" /><span>主题色<small>用于图标边框和背景光晕</small></span></span>
          <input v-model="iconColor" type="color" aria-label="图标主题色" @input="iconColorTouched = true">
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      </div>

      <footer class="modal-card__footer">
        <span class="modal-card__spacer" />
        <button class="quiet-button" type="button" @click="close">取消</button>
        <button class="primary-button primary-button--compact" type="submit" :disabled="saving">
          <LoaderCircle v-if="saving" class="spin" :size="16" /><Check v-else :size="16" />{{ saving ? '保存中' : '保存图标' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
