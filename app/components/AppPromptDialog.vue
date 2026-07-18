<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import type { PromptDialogOptions } from '../types/ui'

const dialog = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const title = ref('')
const label = ref('')
const placeholder = ref('')
const confirmLabel = ref('保存')
const value = ref('')
let resolvePrompt: ((value: string | null) => void) | null = null

function open(options: PromptDialogOptions) {
  resolvePrompt?.(null)
  title.value = options.title
  label.value = options.label
  placeholder.value = options.placeholder || ''
  confirmLabel.value = options.confirmLabel || '保存'
  value.value = options.value || ''
  dialog.value?.showModal()
  nextTick(() => {
    input.value?.focus()
    input.value?.select()
  })
  return new Promise<string | null>((resolve) => {
    resolvePrompt = resolve
  })
}

function finish(result: string | null) {
  const resolve = resolvePrompt
  resolvePrompt = null
  if (dialog.value?.open) dialog.value.close()
  resolve?.(result)
}

function submit() {
  const result = value.value.trim()
  if (result) finish(result)
}

function onClose() {
  if (!resolvePrompt) return
  const resolve = resolvePrompt
  resolvePrompt = null
  resolve(null)
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="modal-dialog modal-dialog--compact" @cancel.prevent="finish(null)" @close="onClose" @click.self="finish(null)">
    <form class="modal-card" @submit.prevent="submit">
      <header class="modal-card__header">
        <div><p class="eyebrow">EDIT NAME</p><h2>{{ title }}</h2></div>
        <button class="icon-button" type="button" aria-label="取消" @click="finish(null)"><X :size="19" /></button>
      </header>
      <div class="modal-card__body">
        <label class="field-label field-label--last">
          <span>{{ label }}</span>
          <input ref="input" v-model="value" maxlength="40" :placeholder="placeholder" required>
        </label>
      </div>
      <footer class="modal-card__footer">
        <span class="modal-card__spacer" />
        <button class="quiet-button" type="button" @click="finish(null)">取消</button>
        <button class="primary-button primary-button--compact" type="submit"><Check :size="16" />{{ confirmLabel }}</button>
      </footer>
    </form>
  </dialog>
</template>
