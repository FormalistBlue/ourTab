<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Tab } from '~/types/ourtab'
import { useTabsStore } from '~/stores/tabs'
import FolderModal from './FolderModal.vue'
import FolderTab from './FolderTab.vue'
import TabItem from './TabItem.vue'

const tabsStore = useTabsStore()
const activeFolder = ref<Tab | undefined>()
const folderOpen = ref(false)
const orderedTabs = computed({
  get: () => tabsStore.currentRootTabs,
  set: async (value: Tab[]) => tabsStore.reorderTabs(value.map((tab, index) => ({ id: tab.id, sortOrder: index }))),
})

function openFolder(tab: Tab) {
  activeFolder.value = tab
  folderOpen.value = true
}
</script>

<template>
  <section class="w-full max-w-5xl px-2">
    <VueDraggable v-model="orderedTabs" class="grid grid-cols-3 justify-items-center gap-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" :animation="180">
      <template v-for="tab in orderedTabs" :key="tab.id">
        <FolderTab v-if="tab.isFolder" :tab="tab" @open="openFolder" />
        <TabItem v-else :tab="tab" />
      </template>
    </VueDraggable>
    <FolderModal v-model:open="folderOpen" :folder="activeFolder" />
  </section>
</template>
