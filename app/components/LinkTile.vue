<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import type { LinkItem } from '#shared/contracts'

const props = defineProps<{ link: LinkItem; iconSize: number }>()
const emit = defineEmits<{ edit: [link: LinkItem] }>()
const initial = computed(() => props.link.title.trim().slice(0, 1).toUpperCase())

function open(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('button')) return
  const newTab = props.link.openMode === 'new-tab' || event.ctrlKey || event.metaKey || event.button === 1
  if (newTab) window.open(props.link.url, '_blank', 'noopener')
  else window.location.assign(props.link.url)
}
</script>

<template>
  <article
    class="link-tile"
    :data-link-id="link.id"
    tabindex="0"
    role="link"
    :aria-label="`打开 ${link.title}`"
    @click="open"
    @auxclick.middle.prevent="open"
    @keydown.enter="open($event as unknown as MouseEvent)"
  >
    <div class="link-tile__actions">
      <button class="icon-button icon-button--micro" type="button" :aria-label="`编辑 ${link.title}`" @click.stop="emit('edit', link)">
        <MoreHorizontal :size="15" />
      </button>
    </div>
    <div
      class="link-icon link-tile__drag"
      title="拖动排序"
      :style="{ '--icon-size': `${iconSize}px`, '--icon-color': link.iconColor }"
    >
      <img v-if="link.iconPath" :src="link.iconPath" alt="" loading="lazy">
      <span v-else>{{ initial }}</span>
    </div>
    <span class="link-tile__label" :title="link.title">{{ link.title }}</span>
  </article>
</template>
