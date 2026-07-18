<script setup lang="ts">
import type { Wallpaper } from '#shared/contracts'

const props = defineProps<{
  wallpaper?: Wallpaper | null
  shaderEnabled: boolean
  shaderIntensity: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let worker: Worker | null = null
let observer: ResizeObserver | null = null

const backgroundStyle = computed(() => props.wallpaper?.imagePath
  ? { backgroundImage: `url("${props.wallpaper.imagePath}")` }
  : undefined)

function sendSize() {
  worker?.postMessage({
    type: 'resize',
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio
  })
}

onMounted(() => {
  if (!props.shaderEnabled || matchMedia('(prefers-reduced-motion: reduce)').matches || !canvas.value) return
  if (!('transferControlToOffscreen' in canvas.value)) return
  worker = new Worker(new URL('../workers/mist.worker.ts', import.meta.url), { type: 'module' })
  const offscreen = canvas.value.transferControlToOffscreen()
  worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen])
  worker.postMessage({ type: 'intensity', value: props.shaderIntensity })
  sendSize()
  observer = new ResizeObserver(sendSize)
  observer.observe(document.documentElement)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
})

watch(() => props.shaderIntensity, value => worker?.postMessage({ type: 'intensity', value }))

function onPointerMove(event: PointerEvent) {
  worker?.postMessage({ type: 'pointer', x: event.clientX / innerWidth, y: 1 - event.clientY / innerHeight })
}

function onVisibility() {
  worker?.postMessage({ type: 'pause', paused: document.hidden })
}

onBeforeUnmount(() => {
  observer?.disconnect()
  worker?.terminate()
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div class="app-background" aria-hidden="true">
    <div class="app-background__image" :class="{ 'app-background__image--custom': wallpaper?.imagePath }" :style="backgroundStyle" />
    <canvas v-if="shaderEnabled" ref="canvas" class="app-background__shader" />
    <div class="app-background__veil" />
    <div class="app-background__grain" />
  </div>
</template>
