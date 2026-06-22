import { z } from 'zod'

export const iconTypeSchema = z.enum(['auto', 'text', 'custom'])
export const backgroundTypeSchema = z.enum(['gradient', 'image', 'color'])
export const localeCodeSchema = z.enum(['zh-CN', 'en-US'])
export const searchEngineSchema = z.object({ id: z.string().min(1), name: z.string().min(1), url: z.string().url() })
export const backgroundSettingSchema = z.object({ type: backgroundTypeSchema, value: z.string().min(1) })
export const appSettingsSchema = z.object({ search_engine: z.string().min(1), search_engines: z.array(searchEngineSchema).min(1), theme: z.string().min(1), language: localeCodeSchema, background: backgroundSettingSchema, sidebar_collapsed: z.boolean() })
export const createGroupSchema = z.object({ name: z.string().trim().min(1), icon: z.string().trim().min(1).nullable().optional(), sortOrder: z.number().int().nonnegative().optional() })
export const updateGroupSchema = createGroupSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one group field is required' })
export const createTabSchema = z.object({ groupId: z.string().min(1), name: z.string().trim().min(1), url: z.string().url(), icon: z.string().trim().min(1).nullable().optional(), iconType: iconTypeSchema.default('auto'), iconColor: z.string().trim().min(1).nullable().optional(), iconBackgroundColor: z.string().trim().min(1).nullable().optional(), isFolder: z.boolean().default(false), folderId: z.string().min(1).nullable().optional(), sortOrder: z.number().int().nonnegative().optional() })
export const updateTabSchema = createTabSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one tab field is required' })
export const reorderSchema = z.object({ items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().nonnegative() })).min(1) })
export const updateSettingSchema = z.discriminatedUnion('key', [
  z.object({ key: z.literal('search_engine'), value: z.string().min(1) }),
  z.object({ key: z.literal('search_engines'), value: z.array(searchEngineSchema).min(1) }),
  z.object({ key: z.literal('theme'), value: z.string().min(1) }),
  z.object({ key: z.literal('language'), value: localeCodeSchema }),
  z.object({ key: z.literal('background'), value: backgroundSettingSchema }),
  z.object({ key: z.literal('sidebar_collapsed'), value: z.boolean() }),
])
export const importPayloadSchema = z.object({ version: z.literal('1.0'), exportedAt: z.string().min(1), groups: z.array(z.any()), tabs: z.array(z.any()), settings: appSettingsSchema })
