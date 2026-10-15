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

/** Current consent requirements and this customer's recorded grants. */
export const consentStateSchema = z.object({
  version: z.string(),
  accepted_at: z.iso.datetime().nullable().optional(),
  required: z.boolean(),
})
export const consentSchema = z.object({
  required_consents: z.record(z.string(), z.string()),
  my_consents: z.record(z.string(), consentStateSchema),
})

/** ConsentIn from the AzaPay OpenAPI contract. */
export const consentInputSchema = z.object({
  scope: z.string().min(1).max(32),
  version: z.string().min(1).max(32),
})

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type Settings = z.infer<typeof settingsSchema>
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
export type Consent = z.infer<typeof consentSchema>
export type ConsentInput = z.infer<typeof consentInputSchema>
