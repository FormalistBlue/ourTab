<script setup lang="ts">
import { computed } from 'vue'
import { useGroupsStore } from '~/stores/groups'
import { useSettingsStore } from '~/stores/settings'

const groupsStore = useGroupsStore()
const settingsStore = useSettingsStore()
const isCollapsed = computed(() => settingsStore.settings.sidebar_collapsed)

function selectGroup(id: string) { groupsStore.currentGroupId = id }
function wheelSwitch(event: WheelEvent) {
  if (groupsStore.groups.length < 2) return
  const currentIndex = groupsStore.groups.findIndex((group) => group.id === groupsStore.currentGroupId)
  const direction = event.deltaY > 0 ? 1 : -1
  const nextIndex = (currentIndex + direction + groupsStore.groups.length) % groupsStore.groups.length
  groupsStore.currentGroupId = groupsStore.groups[nextIndex].id
}
</script>

<template>
  <aside class="flex shrink-0 flex-col items-center gap-3 rounded-3xl border border-white/30 bg-slate-950/40 p-3 text-white shadow-2xl backdrop-blur-xl" :class="isCollapsed ? 'w-16' : 'w-28'" @wheel.prevent="wheelSwitch">
    <strong class="text-xs tracking-[0.25em]">ourTab</strong>
    <button v-for="group in groupsStore.groups" :key="group.id" class="w-full rounded-2xl px-3 py-3 text-sm transition" :class="group.id === groupsStore.currentGroupId ? 'bg-white text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'" type="button" @click="selectGroup(group.id)">
      {{ group.icon || group.name.slice(0, 1) }}<span v-if="!isCollapsed" class="ml-1">{{ group.name }}</span>
    </button>
  </aside>
</template>
