<script setup lang="ts">
import { Check, ExternalLink, LoaderCircle, Trash2, X } from '@lucide/vue'
import type { LinkGroup, LinkItem } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'

const props = defineProps<{ groups: LinkGroup[] }>()
const emit = defineEmits<{ saved: []; closed: [] }>()
const store = useDashboardStore()
const dialog = ref<HTMLDialogElement | null>(null)
const editing = ref<LinkItem | null>(null)
const groupId = ref('')
const title = ref('')
const url = ref('')
const iconPath = ref<string | null>(null)
const iconColor = ref('#d6a85f')
const openMode = ref<'current' | 'new-tab'>('current')
const resolving = ref(false)
const saving = ref(false)
const error = ref('')

const currentGroup = computed(() => props.groups.find(group => group.id === groupId.value))

function open(group: LinkGroup, link?: LinkItem) {
  editing.value = link || null
  groupId.value = link?.groupId || group.id
  title.value = link?.title || ''
  url.value = link?.url || ''
  iconPath.value = link?.iconPath || null
  iconColor.value = link?.iconColor || '#d6a85f'
  openMode.value = link?.openMode || 'current'
  error.value = ''
  dialog.value?.showModal()
  nextTick(() => dialog.value?.querySelector<HTMLInputElement>('input')?.focus())
}

function close() {
  dialog.value?.close()
  emit('closed')
}

async function resolveMetadata() {
  if (!url.value.trim()) return
  resolving.value = true
  error.value = ''
  try {
    const metadata = await $fetch<{ normalizedUrl: string; title: string | null; iconPath: string | null; iconColor: string }>('/api/link-metadata/resolve', {
      method: 'POST',
      body: { url: url.value }
    })
    url.value = metadata.normalizedUrl
    if (!title.value && metadata.title) title.value = metadata.title
    iconPath.value = metadata.iconPath
    iconColor.value = metadata.iconColor
  } catch (cause) {
    error.value = getErrorMessage(cause)
  } finally {
    resolving.value = false
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
    if (editing.value) {
      await store.mutate(`/api/links/${editing.value.id}`, {
        method: 'PATCH',
        body: { title: title.value, url: url.value, iconPath: iconPath.value, iconColor: iconColor.value, openMode: openMode.value }
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
        body: { groupId: groupId.value, title: title.value, url: url.value, iconPath: iconPath.value, iconColor: iconColor.value, openMode: openMode.value }
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
  if (!editing.value || !window.confirm(`删除“${editing.value.title}”？`)) return
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

defineExpose({ open, close })
</script>

<template>
  <dialog ref="dialog" class="modal-dialog" @click.self="close">
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
        <div v-if="iconPath" class="icon-preview-row">
          <span class="link-icon link-icon--small" :style="{ '--icon-color': iconColor }"><img :src="iconPath" alt=""></span>
          <span>已缓存网站图标</span>
          <ExternalLink :size="15" />
        </div>
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
</template>
