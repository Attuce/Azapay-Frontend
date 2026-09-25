import { z } from "zod"

/** UserUpdateIn from AzaPay OpenAPI 0.4.0. */
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).nullable().optional(),
  phone_number: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/)
    .nullable()
    .optional(),
  username: z
    .string()
    .regex(/^[a-z0-9_]{3,30}$/)
    .nullable()
    .optional(),
})

/** SettingsOut returned by the preferences endpoint. */
export const settingsSchema = z.object({
  timezone: z.string(),
  email_transactional: z.boolean(),
  email_marketing: z.boolean(),
  push_enabled: z.boolean(),
  weekly_digest: z.boolean(),
  updated_at: z.iso.datetime(),
})

/** SettingsUpdateIn from AzaPay OpenAPI 0.4.0. */
export const settingsUpdateSchema = z.object({
  timezone: z.string().min(1).max(64).nullable().optional(),
  email_transactional: z.boolean().nullable().optional(),
  email_marketing: z.boolean().nullable().optional(),
  push_enabled: z.boolean().nullable().optional(),
  weekly_digest: z.boolean().nullable().optional(),
})

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type Settings = z.infer<typeof settingsSchema>
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
