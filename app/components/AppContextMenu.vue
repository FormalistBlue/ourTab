<script setup lang="ts">
import { ExternalLink, Image, Pencil, Plus, Settings, Trash2 } from '@lucide/vue'
import type { Component } from 'vue'
import type { ContextMenuIcon, ContextMenuItem } from '../types/ui'

const props = defineProps<{
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()
const emit = defineEmits<{ close: []; select: [id: string] }>()
const menu = ref<HTMLElement | null>(null)
const position = reactive({ left: 0, top: 0 })

const icons: Record<ContextMenuIcon, Component> = {
  external: ExternalLink,
  edit: Pencil,
  image: Image,
  trash: Trash2,
  settings: Settings,
  plus: Plus
}

function fitToViewport() {
  if (!menu.value) return
  const margin = 10
  const rect = menu.value.getBoundingClientRect()
  position.left = Math.max(margin, Math.min(props.x, window.innerWidth - rect.width - margin))
  position.top = Math.max(margin, Math.min(props.y, window.innerHeight - rect.height - margin))
}

function focusableItems() {
  return [...(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])]
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  const items = focusableItems()
  if (!items.length) return
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  let next = current
  if (event.key === 'ArrowDown') next = (current + 1 + items.length) % items.length
  else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = items.length - 1
  else return
  event.preventDefault()
  items[next]?.focus()
}

function onPointerDown(event: PointerEvent) {
  if (props.open && !menu.value?.contains(event.target as Node)) emit('close')
}

function onViewportChange() {
  if (props.open) emit('close')
}

watch(() => [props.open, props.x, props.y, props.items] as const, async ([isOpen]) => {
  if (!isOpen) return
  position.left = props.x
  position.top = props.y
  await nextTick()
  fitToViewport()
  focusableItems()[0]?.focus({ preventScroll: true })
}, { flush: 'post' })

onMounted(() => {
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="open"
        ref="menu"
        class="context-menu"
        role="menu"
        aria-label="快捷操作"
        :style="{ left: `${position.left}px`, top: `${position.top}px` }"
        @contextmenu.prevent
        @keydown="onKeydown"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          role="menuitem"
          :class="{ 'context-menu__item--danger': item.danger, 'context-menu__item--separated': item.separatorBefore }"
          :disabled="item.disabled"
          @click="emit('select', item.id)"
        >
          <component :is="icons[item.icon]" :size="16" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
