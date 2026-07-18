<script setup lang="ts">
import { ArrowUpRight, Search } from '@lucide/vue'
import type { AppPreferences, LinkItem, Workspace } from '#shared/contracts'
import { versionedUploadUrl } from '../utils/assets'

const props = defineProps<{ workspaces: Workspace[]; preferences: AppPreferences }>()
const query = ref('')
const activeIndex = ref(0)
const input = ref<HTMLInputElement | null>(null)
function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function iconUrl(link: LinkItem) {
  return versionedUploadUrl(link.iconPath, link.updatedAt)
}

const matches = computed(() => {
  const value = query.value.trim().toLocaleLowerCase()
  if (!value) return []
  return props.workspaces.flatMap(workspace => workspace.groups.flatMap(group => group.links))
    .filter(link => `${link.title} ${link.url}`.toLocaleLowerCase().includes(value))
    .slice(0, 6)
})

function searchUrl(value: string) {
  const encoded = encodeURIComponent(value)
  if (props.preferences.searchEngine === 'bing') return `https://www.bing.com/search?q=${encoded}`
  if (props.preferences.searchEngine === 'baidu') return `https://www.baidu.com/s?wd=${encoded}`
  return `https://www.google.com/search?q=${encoded}`
}

function openLink(link: LinkItem) {
  window.location.assign(link.url)
}

function submit() {
  const selected = matches.value[activeIndex.value]
  if (selected) openLink(selected)
  else if (query.value.trim()) window.location.assign(searchUrl(query.value.trim()))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, Math.max(matches.value.length - 1, 0))
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }
  if (event.key === 'Escape') {
    query.value = ''
    input.value?.blur()
  }
}

function globalShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if ((event.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
    event.preventDefault()
    input.value?.focus()
  }
}

watch(query, () => { activeIndex.value = 0 })
onMounted(() => window.addEventListener('keydown', globalShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', globalShortcut))
</script>

<template>
  <div class="search-command" :class="{ 'search-command--open': query.trim() }">
    <form class="search-command__bar" @submit.prevent="submit">
      <Search :size="20" aria-hidden="true" />
      <input
        ref="input"
        v-model="query"
        type="search"
        autocomplete="off"
        placeholder="搜索网页或查找网址"
        aria-label="搜索网页或查找网址标签"
        @keydown="onKeydown"
      >
      <kbd>Ctrl K</kbd>
    </form>
    <div v-if="query.trim()" class="search-command__results">
      <button
        v-for="(link, index) in matches"
        :key="link.id"
        type="button"
        :class="{ active: index === activeIndex }"
        @mouseenter="activeIndex = index"
        @click="openLink(link)"
      >
        <span class="search-command__result-icon" :style="{ '--icon-color': link.iconColor }">
          <img v-if="iconUrl(link)" :src="iconUrl(link) || undefined" alt="">
          <span v-else>{{ link.title.slice(0, 1).toUpperCase() }}</span>
        </span>
        <span><strong>{{ link.title }}</strong><small>{{ hostname(link.url) }}</small></span>
        <ArrowUpRight :size="16" />
      </button>
      <button v-if="!matches.length" type="button" class="active" @click="submit">
        <Search :size="18" />
        <span><strong>使用 {{ preferences.searchEngine === 'google' ? 'Google' : preferences.searchEngine === 'bing' ? 'Bing' : '百度' }} 搜索</strong><small>{{ query }}</small></span>
        <ArrowUpRight :size="16" />
      </button>
    </div>
  </div>
</template>
