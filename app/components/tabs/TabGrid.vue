<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { buildReorderItems } from '~/composables/useDragDrop'
import { useGroupsStore } from '~/stores/groups'
import { useTabsStore } from '~/stores/tabs'
import type { Tab } from '~/types/ourtab'
import FolderModal from './FolderModal.vue'
import FolderTab from './FolderTab.vue'
import TabEditModal from './TabEditModal.vue'
import TabItem from './TabItem.vue'

const groupsStore = useGroupsStore()
const tabsStore = useTabsStore()
const activeFolder = ref<Tab | undefined>()
const folderOpen = ref(false)
const editModalOpen = ref(false)
const editingTab = ref<Tab | undefined>()
const editingGroupId = ref('')
const orderedTabs = computed({
  get: () => tabsStore.currentRootTabs,
  set: async (value: Tab[]) => tabsStore.reorderTabs(buildReorderItems(value.map((tab) => tab.id))),
})

function openFolder(tab: Tab) {
  activeFolder.value = tab
  folderOpen.value = true
}

async function handleDelete(tab: Tab) {
  await tabsStore.deleteTab(tab.id)
}

function handleEdit(tab: Tab) {
  editingTab.value = tab
  editingGroupId.value = tab.groupId
  editModalOpen.value = true
}

function handleAdd() {
  editingTab.value = undefined
  editingGroupId.value = groupsStore.currentGroupId
  editModalOpen.value = true
}

function handleSave() {
  tabsStore.fetchTabs()
}
</script>

<template>
  <section class="w-full max-w-5xl px-2">
    <VueDraggable v-model="orderedTabs" class="grid grid-cols-3 justify-items-center gap-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" :animation="180">
      <template v-for="tab in orderedTabs" :key="tab.id">
        <FolderTab v-if="tab.isFolder" :tab="tab" @open="openFolder" @delete="handleDelete" />
        <TabItem v-else :tab="tab" @delete="handleDelete" @edit="handleEdit" />
      </template>
    </VueDraggable>
    <FolderModal v-model:open="folderOpen" :folder="activeFolder" />
    <TabEditModal v-model:open="editModalOpen" :tab="editingTab" :group-id="editingGroupId" @save="handleSave" />
  </section>
</template>
