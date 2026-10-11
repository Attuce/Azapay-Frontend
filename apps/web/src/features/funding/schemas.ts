import { z } from "zod"

/** BankOut from AzaPay OpenAPI 0.4.0. */
export const bankSchema = z.object({
  code: z.string(),
  name: z.string(),
})

/** FundingConnectionKind from AzaPay OpenAPI 0.4.0. */
export const fundingConnectionKindSchema = z.enum([
  "card",
  "bank_account",
  "dedicated_nuban",
])

/** FundingConnectionStatus from AzaPay OpenAPI 0.4.0. */
export const fundingConnectionStatusSchema = z.enum([
  "pending_verification",
  "active",
  "degraded",
  "revoked",
  "expired",
])

/** FundingConnectionOut from AzaPay OpenAPI 0.4.0. */
export const fundingConnectionSchema = z.object({
  id: z.uuid(),
  kind: fundingConnectionKindSchema,
  status: fundingConnectionStatusSchema,
  is_default: z.boolean(),
  currency: z.literal("NGN"),
  account_name: z.string().nullable(),
  bank_name: z.string().nullable(),
  bank_code: z.string().nullable(),
  account_number_last4: z.string().nullable(),
  has_authorization: z.boolean(),
  verified_at: z.iso.datetime().nullable(),
  revoked_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** BankLinkOut from AzaPay OpenAPI 0.4.0. */
export const bankLinkSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  bank_code: z.string(),
  account_number_last4: z.string(),
  resolved_account_name: z.string().nullable(),
  funding_connection_id: z.uuid().nullable(),
  failure_reason: z.string().nullable(),
})

/** FundingConnectionCreateIn from AzaPay OpenAPI 0.4.0. */
export const fundingConnectionCreateSchema = z.object({
  kind: fundingConnectionKindSchema,
  account_name: z.string().max(200).nullable().optional(),
  bank_name: z.string().max(100).nullable().optional(),
  bank_code: z.string().max(20).nullable().optional(),
  account_number_last4: z.string().regex(/^[0-9]{4}$/).nullable().optional(),
  is_default: z.boolean().default(false).optional(),
  provider_authorization_ref: z.string().max(255).nullable().optional(),
})

/** FundingConnectionUpdateIn from AzaPay OpenAPI 0.4.0. */
export const fundingConnectionUpdateSchema = z.object({
  is_default: z.boolean(),
})

/** BankLinkStartIn from AzaPay OpenAPI 0.4.0. */
export const bankLinkStartSchema = z.object({
  bank_code: z.string().min(1).max(20),
  bank_name: z.string().min(1).max(100),
  account_number: z.string().regex(/^[0-9]{10}$/),
})

/** Customer-facing bank selection and account number submitted by the form. */
export const bankLinkSelectionSchema = z.object({
  bank_code: z.string().min(1).max(20),
  account_number: z.string().regex(/^[0-9]{10}$/),
})

/** BankLinkOtpIn from AzaPay OpenAPI 0.4.0. */
export const bankLinkOtpSchema = z.object({
  otp: z.string().min(4).max(10).regex(/^[0-9]+$/),
})

/** UUID path parameter for a bank-link provider challenge. */
export const bankLinkIdSchema = z.uuid()

/** UUID path parameter for a funding source the customer manages. */
export const fundingConnectionIdSchema = z.uuid()

export type Bank = z.infer<typeof bankSchema>
export type FundingConnection = z.infer<typeof fundingConnectionSchema>
export type BankLink = z.infer<typeof bankLinkSchema>
export type FundingConnectionCreateInput = z.infer<typeof fundingConnectionCreateSchema>
export type FundingConnectionUpdateInput = z.infer<typeof fundingConnectionUpdateSchema>
export type BankLinkStartInput = z.infer<typeof bankLinkStartSchema>
export type BankLinkOtpInput = z.infer<typeof bankLinkOtpSchema>
