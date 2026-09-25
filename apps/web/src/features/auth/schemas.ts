import { z } from "zod"

/** LoginIn from AzaPay OpenAPI 0.4.0. */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
})

/** Required RegisterIn fields; optional profile fields are omitted. */
export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(200),
})

/** UserOut returned by the authenticated account endpoint. */
export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  full_name: z.string(),
  username: z.string().nullable(),
  phone_number: z.string().nullable(),
  status: z.enum([
    "pending_verification",
    "active",
    "suspended",
    "deactivated",
  ]),
  currency: z.literal("NGN"),
  identity_status: z.enum([
    "unverified",
    "email_verified",
    "kyc_pending",
    "kyc_approved",
    "kyc_rejected",
  ]),
  email_verified_at: z.iso.datetime().nullable(),
  last_login_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** Token fields shared by AuthOut and TokenPairOut. */
export const tokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.iso.datetime(),
  refresh_expires_at: z.iso.datetime(),
})

/** RefreshIn used to rotate a backend token pair. */
export const refreshSchema = z.object({ refresh_token: z.string() })

/** AuthOut returned after registration or sign-in. */
export const authSchema = tokenPairSchema.extend({ user: userSchema })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type AuthResult = z.infer<typeof authSchema>
export type User = z.infer<typeof userSchema>
export type TokenPair = z.infer<typeof tokenPairSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
