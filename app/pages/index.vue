<script setup lang="ts">
import { onMounted } from 'vue'
import MainContent from '~/components/layout/MainContent.vue'
import Sidebar from '~/components/layout/Sidebar.vue'
import { useGroupsStore } from '~/stores/groups'
import { useSettingsStore } from '~/stores/settings'
import { useTabsStore } from '~/stores/tabs'

const groupsStore = useGroupsStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  await Promise.all([groupsStore.fetchGroups(), tabsStore.fetchTabs(), settingsStore.fetchSettings()])
})
</script>

<template>
  <div class="ourtab-shell flex min-h-screen gap-6 p-4 md:p-6">
    <Sidebar />
    <MainContent />
  </div>
</template>
