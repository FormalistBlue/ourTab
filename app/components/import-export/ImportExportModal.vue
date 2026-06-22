<script setup lang="ts">
import { ref } from 'vue'
import type { ExportPayload } from '~/types/ourtab'

const open = defineModel<boolean>('open', { default: false })
const fileInput = ref<HTMLInputElement | null>(null)

function close() { open.value = false }

async function exportData() {
  const payload = await $fetch<ExportPayload>('/api/export')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `ourtab-export-${payload.exportedAt.slice(0, 10)}.json`
  link.click()
}

async function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const payload = JSON.parse(await file.text())
  await $fetch('/api/import', { method: 'POST', body: payload })
  open.value = false
  window.location.reload()
}
</script>

<template>
  <n-modal :show="open" @update:show="close">
    <n-card :title="$t('importExport.title')" closable segmented style="max-width: 28rem; width: 100%" @close="close">
      <div class="flex flex-col gap-3">
        <n-button data-test="export-button" type="primary" block @click="exportData">{{ $t('importExport.export') }}</n-button>
        <input ref="fileInput" accept="application/json" class="hidden" type="file" @change="importData" />
        <n-button block @click="fileInput?.click()">{{ $t('importExport.import') }}</n-button>
      </div>
    </n-card>
  </n-modal>
</template>
