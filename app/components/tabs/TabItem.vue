<script setup lang="ts">
import type { Tab } from '~/types/ourtab'

const props = defineProps<{ tab: Tab }>()
const emit = defineEmits<{ edit: [tab: Tab]; delete: [tab: Tab] }>()

function openTab() {
  window.open(props.tab.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <button class="flex h-[var(--tabItem-height)] w-[var(--tabItem-width)] flex-col items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/70 p-3 shadow-xl backdrop-blur-xl transition hover:-translate-y-1" type="button" @click="openTab">
    <span class="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-lg font-bold text-[var(--color-primary)]">{{ tab.icon || tab.name.slice(0, 1) }}</span>
    <span class="max-w-full truncate text-sm font-medium">{{ tab.name }}</span>
  </button>
</template>
