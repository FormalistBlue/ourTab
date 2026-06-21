<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { buildSearchUrl } from '~/utils/search'

const settingsStore = useSettingsStore()
const query = ref('')
const selectedEngineId = ref(settingsStore.settings.search_engine)
const selectedEngine = computed(() => settingsStore.settings.search_engines.find((engine) => engine.id === selectedEngineId.value) || settingsStore.settings.search_engines[0])

function submitSearch() {
  if (!query.value.trim() || !selectedEngine.value) return
  window.open(buildSearchUrl(query.value, selectedEngine.value), '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <form class="flex h-[var(--searchBar-height)] w-[var(--searchBar-width)] items-center gap-3 rounded-full border border-white/40 bg-white/80 px-4 shadow-xl backdrop-blur-xl" @submit.prevent="submitSearch">
    <select v-model="selectedEngineId" aria-label="Search engine" class="rounded-full border border-transparent bg-white/60 px-3 py-2 text-sm outline-none">
      <option v-for="engine in settingsStore.settings.search_engines" :key="engine.id" :value="engine.id">{{ engine.name }}</option>
    </select>
    <input v-model="query" :placeholder="$t('search.placeholder')" class="min-w-0 flex-1 bg-transparent text-base outline-none" />
    <button class="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white" type="submit">{{ $t('common.confirm') }}</button>
  </form>
</template>
