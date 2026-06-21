import { describe, expect, it } from 'vitest'
import { createDatabase } from '../../server/database/client'
import { createGroup, deleteGroup, listGroups, reorderGroups, updateGroup } from '../../server/repositories/groups'
import { getSettings, updateSetting } from '../../server/repositories/settings'
import { createTab, deleteTab, listTabs, reorderTabs, updateTab } from '../../server/repositories/tabs'

function makeDb() {
  return createDatabase(':memory:').db
}

describe('repositories', () => {
  it('creates, updates, reorders, and deletes groups', () => {
    const db = makeDb()
    const work = createGroup(db, { name: 'Work', icon: 'briefcase' })
    const life = createGroup(db, { name: 'Life', icon: 'home' })

    expect(listGroups(db).map((group) => group.name)).toEqual(['Work', 'Life'])
    expect(updateGroup(db, work.id, { name: 'Focus' })?.name).toBe('Focus')

    reorderGroups(db, [{ id: life.id, sortOrder: 0 }, { id: work.id, sortOrder: 1 }])
    expect(listGroups(db).map((group) => group.id)).toEqual([life.id, work.id])

    deleteGroup(db, life.id)
    expect(listGroups(db).map((group) => group.id)).toEqual([work.id])
  })

  it('creates folder and non-folder tabs and cascades folder children', () => {
    const db = makeDb()
    const group = createGroup(db, { name: 'Work' })
    const folder = createTab(db, { groupId: group.id, name: 'Docs', url: 'https://example.com/folder', iconType: 'text', icon: 'D', isFolder: true, folderId: null })
    const child = createTab(db, { groupId: group.id, name: 'Nuxt', url: 'https://nuxt.com', iconType: 'auto', isFolder: false, folderId: folder.id })

    expect(listTabs(db).map((tab) => tab.name)).toEqual(['Docs', 'Nuxt'])
    expect(updateTab(db, child.id, { name: 'Nuxt Docs' })?.name).toBe('Nuxt Docs')

    reorderTabs(db, [{ id: child.id, sortOrder: 0 }, { id: folder.id, sortOrder: 1 }])
    expect(listTabs(db).map((tab) => tab.sortOrder)).toEqual([0, 1])

    deleteTab(db, folder.id)
    expect(listTabs(db)).toEqual([])
  })

  it('returns default settings and updates one setting at a time', () => {
    const db = makeDb()
    expect(getSettings(db).language).toBe('zh-CN')
    expect(getSettings(db).search_engine).toBe('google')

    updateSetting(db, 'language', 'en-US')
    updateSetting(db, 'sidebar_collapsed', true)

    expect(getSettings(db).language).toBe('en-US')
    expect(getSettings(db).sidebar_collapsed).toBe(true)
  })
})
