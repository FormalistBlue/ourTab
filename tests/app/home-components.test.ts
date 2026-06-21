import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBar from '~/components/layout/SearchBar.vue'
import Sidebar from '~/components/layout/Sidebar.vue'
import FolderModal from '~/components/tabs/FolderModal.vue'
import TabGrid from '~/components/tabs/TabGrid.vue'
import { defaultSettings } from '~/constants/defaults'
import { useGroupsStore } from '~/stores/groups'
import { useSettingsStore } from '~/stores/settings'
import { useTabsStore } from '~/stores/tabs'

function seedStores() {
  setActivePinia(createPinia())
  const groups = useGroupsStore()
  groups.groups = [{ id: 'g1', name: 'Work', icon: null, sortOrder: 0, createdAt: 'now', updatedAt: 'now' }, { id: 'g2', name: 'Life', icon: null, sortOrder: 1, createdAt: 'now', updatedAt: 'now' }]
  groups.currentGroupId = 'g1'
  useSettingsStore().settings = structuredClone(defaultSettings)
  useTabsStore().tabs = [
    { id: 'folder', groupId: 'g1', name: 'Docs', url: 'https://example.com/folder', icon: 'D', iconType: 'text', isFolder: true, folderId: null, sortOrder: 0, createdAt: 'now', updatedAt: 'now' },
    { id: 'tab', groupId: 'g1', name: 'GitHub', url: 'https://github.com', icon: null, iconType: 'auto', isFolder: false, folderId: null, sortOrder: 1, createdAt: 'now', updatedAt: 'now' },
    { id: 'child', groupId: 'g1', name: 'Nuxt', url: 'https://nuxt.com', icon: null, iconType: 'auto', isFolder: false, folderId: 'folder', sortOrder: 0, createdAt: 'now', updatedAt: 'now' },
  ]
}

const globalMocks = {
  global: {
    mocks: {
      $t: (key: string) => key,
    },
  },
}

describe('home components', () => {
  beforeEach(() => {
    seedStores()
    vi.mocked(window.open).mockReset()
  })

  it('submits search with the selected search engine', async () => {
    const wrapper = mount(SearchBar, globalMocks)
    await wrapper.get('input').setValue('nuxt docs')
    await wrapper.get('form').trigger('submit')
    expect(window.open).toHaveBeenCalledWith('https://www.google.com/search?q=nuxt%20docs', '_blank', 'noopener,noreferrer')
  })

  it('switches groups by click and wheel', async () => {
    const wrapper = mount(Sidebar, globalMocks)
    const groups = useGroupsStore()
    await wrapper.findAll('button')[1].trigger('click')
    expect(groups.currentGroupId).toBe('g2')
    await wrapper.trigger('wheel', { deltaY: -100 })
    expect(groups.currentGroupId).toBe('g1')
  })

  it('renders root tabs and opens folder contents', async () => {
    const wrapper = mount(TabGrid, { ...globalMocks, global: { ...globalMocks.global, stubs: { VueDraggable: { template: '<div><slot /></div>' } } } })
    expect(wrapper.text()).toContain('Docs')
    expect(wrapper.text()).toContain('GitHub')
    expect(wrapper.text()).not.toContain('Nuxt')
    await wrapper.get('[data-test="folder-tab"]').trigger('click')
    expect(wrapper.text()).toContain('Nuxt')
  })

  it('lists folder children in the folder modal', () => {
    const folder = useTabsStore().tabs.find((tab) => tab.id === 'folder')
    const wrapper = mount(FolderModal, { ...globalMocks, props: { folder, open: true } })
    expect(wrapper.text()).toContain('Docs')
    expect(wrapper.text()).toContain('Nuxt')
  })
})
