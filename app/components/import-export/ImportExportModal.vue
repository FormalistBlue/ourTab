<script setup lang="ts">
import { ref } from 'vue'
import type { ExportPayload } from '~/types/ourtab'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const fileInput = ref<HTMLInputElement | null>(null)

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
  emit('update:open', false)
  window.location.reload()
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="emit('update:open', false)">
    <section class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
      <h2 class="mb-4 text-xl font-bold">{{ $t('importExport.title') }}</h2>
      <div class="flex flex-col gap-3">
        <button data-test="export-button" class="rounded-2xl bg-slate-950 px-4 py-3 text-white" type="button" @click="exportData">{{ $t('importExport.export') }}</button>
        <input ref="fileInput" accept="application/json" class="hidden" type="file" @change="importData" />
        <button class="rounded-2xl border border-slate-200 px-4 py-3" type="button" @click="fileInput?.click()">{{ $t('importExport.import') }}</button>
      </div>
    </section>
  </div>
</template>
