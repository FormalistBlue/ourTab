<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import type { LinkItem } from '#shared/contracts'
import { versionedUploadUrl } from '../utils/assets'

const props = defineProps<{ link: LinkItem; iconSize: number }>()
const emit = defineEmits<{ menu: [request: { link: LinkItem; x: number; y: number }] }>()
const initial = computed(() => props.link.title.trim().slice(0, 1).toUpperCase())
const iconUrl = computed(() => versionedUploadUrl(props.link.iconPath, props.link.updatedAt))

function open(event?: MouseEvent, forceNewTab = false) {
  if (event && (event.target as HTMLElement).closest('button')) return
  const newTab = forceNewTab || props.link.openMode === 'new-tab' || event?.ctrlKey || event?.metaKey || event?.button === 1
  if (newTab) window.open(props.link.url, '_blank', 'noopener')
  else window.location.assign(props.link.url)
}

function showMenu(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  const button = (event.target as HTMLElement).closest('button')
  const rect = button?.getBoundingClientRect()
  emit('menu', {
    link: props.link,
    x: event.clientX || (rect ? rect.right : window.innerWidth / 2),
    y: event.clientY || (rect ? rect.bottom + 5 : window.innerHeight / 2)
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    open()
  } else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    event.preventDefault()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    emit('menu', { link: props.link, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }
}
</script>

<template>
  <article
    class="link-tile"
    :data-link-id="link.id"
    tabindex="0"
    role="link"
    :aria-label="`打开 ${link.title}`"
    @click="open($event)"
    @auxclick.middle.prevent="open($event, true)"
    @contextmenu="showMenu"
    @keydown="onKeydown"
  >
    <div class="link-tile__actions">
      <button class="icon-button icon-button--micro" type="button" :aria-label="`打开 ${link.title} 操作菜单`" @click="showMenu">
        <MoreHorizontal :size="15" />
      </button>
    </div>
    <div
      class="link-icon link-tile__drag"
      title="拖动排序"
      :style="{ '--icon-size': `${iconSize}px`, '--icon-color': link.iconColor }"
    >
      <img v-if="iconUrl" :src="iconUrl" alt="" loading="lazy">
      <span v-else>{{ initial }}</span>
    </div>
    <span class="link-tile__label" :title="link.title">{{ link.title }}</span>
  </article>
</template>
