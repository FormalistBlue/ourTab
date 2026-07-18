<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { LinkGroup, LinkItem } from '#shared/contracts'

const props = defineProps<{ group: LinkGroup; iconSize: number }>()
const emit = defineEmits<{
  add: [groupId: string]
  menu: [request: { link: LinkItem; x: number; y: number }]
  order: [groupId: string, ids: string[]]
  move: [linkId: string, groupId: string, index: number]
}>()

const localLinks = ref<LinkItem[]>([])
watch(() => props.group.links, links => { localLinks.value = [...links] }, { immediate: true, deep: true })

function onUpdate() {
  emit('order', props.group.id, localLinks.value.map(link => link.id))
}

function onAdd(event: { item: HTMLElement; newIndex?: number }) {
  const linkId = event.item.dataset.linkId
  if (linkId) emit('move', linkId, props.group.id, event.newIndex ?? localLinks.value.length - 1)
}
</script>

<template>
  <section class="link-group">
    <header class="link-group__header">
      <div>
        <span class="link-group__marker" />
        <h2>{{ group.name }}</h2>
        <span class="link-group__count">{{ localLinks.length }}</span>
      </div>
      <button class="quiet-button" type="button" @click="emit('add', group.id)">
        <Plus :size="16" />
        添加网址
      </button>
    </header>

    <VueDraggable
      v-model="localLinks"
      class="link-grid"
      :group="{ name: 'ourtab-links', pull: true, put: true }"
      item-key="id"
      handle=".link-tile__drag"
      :animation="220"
      ghost-class="link-tile--ghost"
      drag-class="link-tile--dragging"
      @update="onUpdate"
      @add="onAdd"
    >
      <LinkTile
        v-for="link in localLinks"
        :key="link.id"
        :link="link"
        :icon-size="iconSize"
        @menu="emit('menu', $event)"
      />
      <button v-if="!localLinks.length" class="empty-link-tile" type="button" @click="emit('add', group.id)">
        <Plus :size="21" />
        <span>添加第一个网址</span>
      </button>
    </VueDraggable>
  </section>
</template>
