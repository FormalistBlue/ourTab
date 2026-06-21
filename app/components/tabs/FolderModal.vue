<script setup lang="ts">
import { computed } from 'vue'
import type { Tab } from '~/types/ourtab'
import { useTabsStore } from '~/stores/tabs'
import TabItem from './TabItem.vue'

const props = defineProps<{ folder?: Tab; open: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const tabsStore = useTabsStore()
const children = computed(() => props.folder ? tabsStore.folderTabs(props.folder.id) : [])
</script>

<template>
  <div v-if="open && folder" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4" @click.self="emit('update:open', false)">
    <section class="w-full max-w-2xl rounded-3xl border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl">
      <header class="mb-5 flex items-center justify-between">
        <h2 class="text-xl font-bold">{{ folder.name }}</h2>
        <button class="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" type="button" @click="emit('update:open', false)">{{ $t('common.close') }}</button>
      </header>
      <div v-if="children.length" class="grid grid-cols-3 gap-4 sm:grid-cols-5">
        <TabItem v-for="tab in children" :key="tab.id" :tab="tab" />
      </div>
      <p v-else class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{{ $t('folder.empty') }}</p>
    </section>
  </div>
</template>
