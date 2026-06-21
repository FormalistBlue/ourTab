<script setup lang="ts">
import { showContextMenu } from '~/components/context-menu/useContextMenu'
import type { Tab } from '~/types/ourtab'

const props = defineProps<{ tab: Tab }>()
const emit = defineEmits<{ open: [tab: Tab]; edit: [tab: Tab]; delete: [tab: Tab] }>()

function openMenu(event: MouseEvent) {
  showContextMenu(event, [
    { label: 'Edit', onClick: () => emit('edit', props.tab) },
    { label: 'Delete', onClick: () => emit('delete', props.tab) },
  ])
}
</script>

<template>
  <button data-test="folder-tab" class="flex h-[var(--tabItem-height)] w-[var(--tabItem-width)] flex-col items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/70 p-3 shadow-xl backdrop-blur-xl transition hover:-translate-y-1" type="button" @click="$emit('open', tab)" @contextmenu="openMenu">
    <span class="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-lg font-bold text-[var(--color-primary)]">{{ tab.icon || 'F' }}</span>
    <span class="max-w-full truncate text-sm font-medium">{{ tab.name }}</span>
  </button>
</template>
