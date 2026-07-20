import { asc, eq } from 'drizzle-orm'
import type { AppPreferences, DashboardSnapshot, LinkGroup, LinkItem, Wallpaper, Workspace } from '../../shared/contracts'
import { appState, linkGroups, links, preferences, wallpapers, workspaces } from '../database/schema'
import { getDb } from '../database/client'

export function getDashboard(userId: string): DashboardSnapshot {
  const db = getDb()
  const workspaceRows = db.select().from(workspaces).orderBy(asc(workspaces.sortOrder)).all()
  const groupRows = db.select().from(linkGroups).orderBy(asc(linkGroups.sortOrder)).all()
  const linkRows = db.select().from(links).orderBy(asc(links.sortOrder)).all()
  const wallpaperRows = db.select().from(wallpapers).all()
  const preferenceRow = db.select().from(preferences).where(eq(preferences.userId, userId)).get()
  const revision = db.select({ revision: appState.revision }).from(appState).where(eq(appState.id, 1)).get()?.revision ?? 0

  const linkMap = new Map<string, LinkItem[]>()
  for (const link of linkRows) {
    const list = linkMap.get(link.groupId) || []
    list.push(link)
    linkMap.set(link.groupId, list)
  }

  const groupMap = new Map<string, LinkGroup[]>()
  for (const group of groupRows) {
    const list = groupMap.get(group.workspaceId) || []
    list.push({ ...group, links: linkMap.get(group.id) || [] })
    groupMap.set(group.workspaceId, list)
  }

  const workspaceData: Workspace[] = workspaceRows.map(workspace => ({
    ...workspace,
    groups: groupMap.get(workspace.id) || []
  }))

  const wallpaperData: Wallpaper[] = wallpaperRows
  const preferenceData: AppPreferences = preferenceRow
    ? {
        searchEngine: preferenceRow.searchEngine,
        defaultOpenMode: preferenceRow.defaultOpenMode,
        theme: preferenceRow.theme,
        globalWallpaperId: preferenceRow.globalWallpaperId,
        shaderEnabled: preferenceRow.shaderEnabled,
        shaderIntensity: preferenceRow.shaderIntensity,
        iconSize: preferenceRow.iconSize,
        tileRadius: preferenceRow.tileRadius,
        tileOpacity: preferenceRow.tileOpacity,
        gridGap: preferenceRow.gridGap,
        heroOffset: preferenceRow.heroOffset
      }
    : {
        searchEngine: 'google',
        defaultOpenMode: 'current',
        theme: 'mist',
        globalWallpaperId: null,
        shaderEnabled: false,
        shaderIntensity: 0.55,
        iconSize: 64,
        tileRadius: 18,
        tileOpacity: 0.055,
        gridGap: 11,
        heroOffset: 24
      }

  return {
    revision,
    workspaces: workspaceData,
    wallpapers: wallpaperData,
    preferences: preferenceData
  }
}
