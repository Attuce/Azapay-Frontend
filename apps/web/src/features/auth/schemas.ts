import { z } from "zod"

/** UserOut returned by AzaPay for the authenticated Clerk principal. */
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

export type User = z.infer<typeof userSchema>
