<script setup lang="ts">
import SearchBar from './SearchBar.vue'
import TabGrid from '~/components/tabs/TabGrid.vue'

defineEmits<{ openSettings: []; openImportExport: [] }>()
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col items-center gap-10 pt-10 md:pt-16">
    <div class="flex w-full max-w-5xl justify-end gap-3 px-2">
      <button class="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur" type="button" @click="$emit('openImportExport')">{{ $t('importExport.title') }}</button>
      <button class="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur" type="button" @click="$emit('openSettings')">{{ $t('settings.title') }}</button>
    </div>
    <SearchBar />
    <TabGrid />
  </main>
</template>
