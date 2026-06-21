<script setup lang="ts">
import SearchBar from './SearchBar.vue'
import TabGrid from '~/components/tabs/TabGrid.vue'
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col items-center gap-10 pt-10 md:pt-16">
    <SearchBar />
    <TabGrid />
  </main>
</template>
