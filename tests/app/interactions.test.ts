import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ImportExportModal from '~/components/import-export/ImportExportModal.vue'
import { buildReorderItems } from '~/composables/useDragDrop'

describe('interaction helpers', () => {
  it('converts ordered ids into reorder payloads', () => {
    expect(buildReorderItems(['a', 'b', 'c'])).toEqual([{ id: 'a', sortOrder: 0 }, { id: 'b', sortOrder: 1 }, { id: 'c', sortOrder: 2 }])
  })

  it('downloads exported data as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ version: '1.0', exportedAt: 'now', groups: [], tabs: [], settings: {} })
    vi.stubGlobal('$fetch', fetchMock)
    URL.createObjectURL = vi.fn().mockReturnValue('blob:ourtab')
    const wrapper = mount(ImportExportModal, { props: { open: true }, global: { mocks: { $t: (key: string) => key } } })

    await wrapper.get('[data-test="export-button"]').trigger('click')

    expect(fetchMock).toHaveBeenCalledWith('/api/export')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
})
