import { z } from 'zod'

export const idSchema = z.string().uuid()
export const nameSchema = z.string().trim().min(1).max(40)
export const titleSchema = z.string().trim().min(1).max(80)

export const setupSchema = z.object({
  token: z.string().min(16).max(256),
  username: z.string().trim().min(3).max(32).regex(/^[\p{L}\p{N}_.-]+$/u),
  password: z.string().min(12).max(128)
})

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(128)
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128)
})

export const workspaceCreateSchema = z.object({
  name: nameSchema
})

export const workspaceUpdateSchema = z.object({
  name: nameSchema.optional(),
  wallpaperId: idSchema.nullable().optional()
}).refine(value => Object.keys(value).length > 0, '至少需要修改一个字段')

export const groupCreateSchema = z.object({
  workspaceId: idSchema,
  name: nameSchema
})

export const groupUpdateSchema = z.object({
  name: nameSchema
})

export const linkCreateSchema = z.object({
  groupId: idSchema,
  title: titleSchema,
  url: z.string().trim().min(1).max(2048),
  iconPath: z.string().max(512).nullable().optional(),
  iconColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  openMode: z.enum(['current', 'new-tab']).optional()
})

export const linkUpdateSchema = linkCreateSchema.omit({ groupId: true }).partial()
  .refine(value => Object.keys(value).length > 0, '至少需要修改一个字段')

export const metadataSchema = z.object({
  url: z.string().trim().min(1).max(2048)
})

export const orderedIdsSchema = z.object({
  ids: z.array(idSchema).max(500)
})

export const moveLinkSchema = z.object({
  targetGroupId: idSchema,
  targetIndex: z.number().int().min(0).max(500)
})

export const preferencesSchema = z.object({
  searchEngine: z.enum(['google', 'bing', 'baidu']).optional(),
  defaultOpenMode: z.enum(['current', 'new-tab']).optional(),
  globalWallpaperId: idSchema.nullable().optional(),
  shaderEnabled: z.boolean().optional(),
  shaderIntensity: z.number().min(0).max(1).optional(),
  iconSize: z.number().int().min(48).max(88).optional()
}).refine(value => Object.keys(value).length > 0, '至少需要修改一个设置')
