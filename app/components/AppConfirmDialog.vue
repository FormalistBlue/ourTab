<script setup lang="ts">
import { AlertTriangle, Check, X } from '@lucide/vue'
import type { ConfirmDialogOptions } from '../types/ui'

const dialog = ref<HTMLDialogElement | null>(null)
const title = ref('')
const message = ref('')
const confirmLabel = ref('确认')
const danger = ref(false)
let resolveConfirm: ((value: boolean) => void) | null = null

function open(options: ConfirmDialogOptions) {
  resolveConfirm?.(false)
  title.value = options.title
  message.value = options.message
  confirmLabel.value = options.confirmLabel || '确认'
  danger.value = Boolean(options.danger)
  dialog.value?.showModal()
  return new Promise<boolean>((resolve) => {
    resolveConfirm = resolve
  })
}

function finish(result: boolean) {
  const resolve = resolveConfirm
  resolveConfirm = null
  if (dialog.value?.open) dialog.value.close()
  resolve?.(result)
}

function onClose() {
  if (!resolveConfirm) return
  const resolve = resolveConfirm
  resolveConfirm = null
  resolve(false)
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="modal-dialog modal-dialog--compact" @cancel.prevent="finish(false)" @close="onClose" @click.self="finish(false)">
    <form class="modal-card" @submit.prevent="finish(true)">
      <header class="modal-card__header">
        <div><p class="eyebrow">PLEASE CONFIRM</p><h2>{{ title }}</h2></div>
        <button class="icon-button" type="button" aria-label="取消" @click="finish(false)"><X :size="19" /></button>
      </header>
      <div class="modal-card__body confirm-copy">
        <span class="confirm-copy__icon" :class="{ 'confirm-copy__icon--danger': danger }"><AlertTriangle :size="20" /></span>
        <p>{{ message }}</p>
      </div>
      <footer class="modal-card__footer">
        <span class="modal-card__spacer" />
        <button class="quiet-button" type="button" @click="finish(false)">取消</button>
        <button :class="danger ? 'danger-button' : 'primary-button primary-button--compact'" type="submit">
          <Check :size="16" />{{ confirmLabel }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
