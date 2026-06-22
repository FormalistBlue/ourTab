<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Tab, CreateTabInput, UpdateTabInput, IconType } from '~/types/ourtab'
import { useTabsStore } from '~/stores/tabs'

const props = defineProps<{
  tab?: Tab
  groupId: string
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [tab: Tab]
}>()

const tabsStore = useTabsStore()
const formData = ref({
  name: '',
  url: '',
  iconType: 'auto' as IconType,
  iconColor: '',
  iconBackgroundColor: '',
})

const isEditing = computed(() => !!props.tab)
const faviconUrl = ref<string | null>(null)
const loadingFavicon = ref(false)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.tab) {
      formData.value = {
        name: props.tab.name,
        url: props.tab.url,
        iconType: props.tab.iconType,
        iconColor: props.tab.iconColor || '',
        iconBackgroundColor: props.tab.iconBackgroundColor || '',
      }
      faviconUrl.value = props.tab.icon && props.tab.icon.startsWith('http') ? props.tab.icon : null
    } else {
      formData.value = {
        name: '',
        url: '',
        iconType: 'auto',
        iconColor: '',
        iconBackgroundColor: '',
      }
      faviconUrl.value = null
    }
  }
})

function close() {
  emit('update:open', false)
}

async function fetchFavicon(url: string) {
  if (!url) return

  loadingFavicon.value = true
  faviconUrl.value = null

  try {
    const domain = new URL(url).origin
    const faviconPaths = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/favicon.png',
    ]

    for (const path of faviconPaths) {
      try {
        const response = await fetch(`${domain}${path}`, { method: 'HEAD' })
        if (response.ok) {
          faviconUrl.value = `${domain}${path}`
          break
        }
      } catch {
        // 继续尝试下一个路径
      }
    }
  } catch (error) {
    console.error('Failed to fetch favicon:', error)
  } finally {
    loadingFavicon.value = false
  }
}

watch(() => formData.value.url, (newUrl) => {
  if (formData.value.iconType === 'auto' && newUrl) {
    fetchFavicon(newUrl)
  }
})

watch(() => formData.value.iconType, (newType) => {
  if (newType === 'auto' && formData.value.url) {
    fetchFavicon(formData.value.url)
  }
})

async function save() {
  if (!formData.value.name || !formData.value.url) {
    return
  }

  const tabData = {
    name: formData.value.name,
    url: formData.value.url,
    iconType: formData.value.iconType,
    iconColor: formData.value.iconType === 'text' ? formData.value.iconColor : null,
    iconBackgroundColor: formData.value.iconType === 'text' ? formData.value.iconBackgroundColor : null,
    icon: formData.value.iconType === 'auto' ? faviconUrl.value : null,
  }

  if (isEditing.value && props.tab) {
    await tabsStore.updateTab(props.tab.id, tabData as UpdateTabInput)
  } else {
    await tabsStore.createTab({ ...tabData, groupId: props.groupId, isFolder: false } as CreateTabInput)
  }

  emit('save', tabData as Tab)
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="ourtab-modal-overlay" @click.self="close">
        <n-card :title="isEditing ? $t('tabEdit.title.edit') : $t('tabEdit.title.add')" closable segmented style="max-width: 32rem; width: 100%" @close="close">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.name') }}</label>
              <n-input v-model:value="formData.name" :placeholder="$t('tabEdit.namePlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.url') }}</label>
              <n-input v-model:value="formData.url" :placeholder="$t('tabEdit.urlPlaceholder')" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconType') }}</label>
              <n-radio-group v-model:value="formData.iconType">
                <n-radio value="auto">{{ $t('tabEdit.iconType.auto') }}</n-radio>
                <n-radio value="text">{{ $t('tabEdit.iconType.text') }}</n-radio>
              </n-radio-group>
            </div>

            <!-- 自动抓取模式预览 -->
            <div v-if="formData.iconType === 'auto'" class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white/70">
                <img v-if="faviconUrl" :src="faviconUrl" class="size-8 object-contain" @error="faviconUrl = null" />
                <span v-else class="text-lg font-bold text-[var(--color-primary)]">
                  {{ loadingFavicon ? '...' : formData.name.slice(0, 1) }}
                </span>
              </div>
              <span class="text-sm text-gray-500">
                {{ loadingFavicon ? $t('tabEdit.fetchingFavicon') : (faviconUrl ? $t('tabEdit.faviconFound') : $t('tabEdit.faviconNotFound')) }}
              </span>
            </div>

            <!-- 图标配置区域 -->
            <div v-if="formData.iconType === 'text'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconColor') }}</label>
                <n-color-picker v-model:value="formData.iconColor" :show-alpha="true" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconBackgroundColor') }}</label>
                <n-color-picker v-model:value="formData.iconBackgroundColor" :show-alpha="true" />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <n-button @click="close">{{ $t('tabEdit.cancel') }}</n-button>
              <n-button type="primary" @click="save">{{ $t('tabEdit.save') }}</n-button>
            </div>
          </template>
        </n-card>
      </div>
    </Transition>
  </Teleport>
</template>
