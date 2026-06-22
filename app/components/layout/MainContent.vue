<script setup lang="ts">
import ContextMenu from '@imengyu/vue3-context-menu'
import TabEditModal from '~/components/tabs/TabEditModal.vue'
import SearchBar from './SearchBar.vue'
import TabGrid from '~/components/tabs/TabGrid.vue'
import { useGroupsStore } from '~/stores/groups'
import { useTabsStore } from '~/stores/tabs'

defineEmits<{ openSettings: []; openImportExport: [] }>()

const { t } = useI18n()
const groupsStore = useGroupsStore()
const tabsStore = useTabsStore()
const editModalOpen = ref(false)
const editingGroupId = ref('')

function handleContextMenu(event: MouseEvent) {
  event.preventDefault()

  ContextMenu.showContextMenu({
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        label: t('contextMenu.addTab'),
        onClick: () => {
          editingGroupId.value = groupsStore.currentGroupId
          editModalOpen.value = true
        },
      },
      {
        label: t('contextMenu.settings'),
        onClick: () => {
          // Settings modal is handled by parent via emit
        },
      },
    ],
  })
}

function handleSave() {
  tabsStore.fetchTabs()
}
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col items-center gap-10 pt-10 md:pt-16" @contextmenu="handleContextMenu">
    <div class="flex w-full max-w-5xl justify-end gap-3 px-2">
      <n-button @click="$emit('openImportExport')">{{ $t('importExport.title') }}</n-button>
      <n-button @click="$emit('openSettings')">{{ $t('settings.title') }}</n-button>
    </div>
    <SearchBar />
    <TabGrid />
    <TabEditModal
      v-model:open="editModalOpen"
      :group-id="editingGroupId"
      @save="handleSave"
    />
  </main>
</template>
