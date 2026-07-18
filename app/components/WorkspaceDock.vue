<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Workspace } from '#shared/contracts'

const props = defineProps<{ workspaces: Workspace[]; activeId: string }>()
const emit = defineEmits<{
  select: [id: string]
  add: []
  order: [ids: string[]]
}>()
const localWorkspaces = ref<Workspace[]>([])
watch(() => props.workspaces, value => { localWorkspaces.value = [...value] }, { immediate: true, deep: true })
</script>

<template>
  <nav class="workspace-dock" aria-label="工作区">
    <VueDraggable
      v-model="localWorkspaces"
      class="workspace-dock__list"
      item-key="id"
      :animation="180"
      @end="emit('order', localWorkspaces.map(workspace => workspace.id))"
    >
      <button
        v-for="workspace in localWorkspaces"
        :key="workspace.id"
        type="button"
        :class="{ active: workspace.id === activeId }"
        @click="emit('select', workspace.id)"
      >
        <span />{{ workspace.name }}
      </button>
    </VueDraggable>
    <button class="workspace-dock__add" type="button" aria-label="添加工作区" @click="emit('add')">
      <Plus :size="17" />
    </button>
  </nav>
</template>
