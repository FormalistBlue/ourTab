import { del, get, set } from 'idb-keyval'
import { defineStore } from 'pinia'
import type { DashboardSnapshot, LinkGroup, Workspace } from '#shared/contracts'

const CACHE_KEY = 'ourtab:dashboard:v1'

export const useDashboardStore = defineStore('dashboard', () => {
  const snapshot = ref<DashboardSnapshot | null>(null)
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref('')
  const activeWorkspaceId = ref('')

  const workspaces = computed(() => snapshot.value?.workspaces || [])
  const activeWorkspace = computed<Workspace | null>(() => {
    return workspaces.value.find(workspace => workspace.id === activeWorkspaceId.value) || workspaces.value[0] || null
  })

  function selectWorkspace(id: string) {
    activeWorkspaceId.value = id
    if (import.meta.client) localStorage.setItem('ourtab:active-workspace', id)
  }

  async function hydrate() {
    if (!import.meta.client || snapshot.value) return
    const cached = await get<DashboardSnapshot>(CACHE_KEY)
    if (cached) snapshot.value = cached
    const savedWorkspace = localStorage.getItem('ourtab:active-workspace')
    if (savedWorkspace) activeWorkspaceId.value = savedWorkspace
  }

  async function refresh(options: { quiet?: boolean } = {}) {
    if (syncing.value) return
    syncing.value = true
    if (!options.quiet) loading.value = true
    error.value = ''

    try {
      const headers = new Headers()
      if (snapshot.value) headers.set('if-none-match', `"${snapshot.value.revision}"`)
      const response = await fetch('/api/dashboard', { credentials: 'same-origin', headers })
      if (response.status === 401) {
        await del(CACHE_KEY)
        await navigateTo('/login')
        return
      }
      if (response.status === 304) return
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.statusMessage || '同步失败')

      const data = await response.json() as DashboardSnapshot
      snapshot.value = data
      await set(CACHE_KEY, data)
      if (!activeWorkspaceId.value || !data.workspaces.some(workspace => workspace.id === activeWorkspaceId.value)) {
        selectWorkspace(data.workspaces[0]?.id || '')
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '同步失败'
      if (!snapshot.value) throw cause
    } finally {
      loading.value = false
      syncing.value = false
    }
  }

  async function mutate<T>(url: string, options: Parameters<typeof $fetch<T>>[1]) {
    error.value = ''
    try {
      const result = await $fetch<T>(url, options)
      await refresh({ quiet: true })
      return result
    } catch (cause) {
      error.value = getErrorMessage(cause)
      await refresh({ quiet: true })
      throw cause
    }
  }

  function groupById(id: string): LinkGroup | undefined {
    return workspaces.value.flatMap(workspace => workspace.groups).find(group => group.id === id)
  }

  return {
    snapshot,
    loading,
    syncing,
    error,
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    hydrate,
    refresh,
    mutate,
    selectWorkspace,
    groupById
  }
})

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error) {
    const candidate = error as { data?: { statusMessage?: string; message?: string }; message?: string }
    return candidate.data?.statusMessage || candidate.data?.message || candidate.message || '操作失败'
  }
  return '操作失败'
}
