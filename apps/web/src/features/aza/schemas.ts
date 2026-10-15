import { z } from "zod"

const moneySchema = z.string().regex(/^(?:0|[1-9]\d*)\.\d{2}$/).refine((amount) => amount !== "0.00")
const nullableMoneySchema = moneySchema.nullable()
const dateTimeSchema = z.iso.datetime().nullable()

/** AzaOut fields required by OpenAPI 0.4.0, including backend-owned balances. */
export const azaSchema = z.object({
  id: z.uuid(), owner_user_id: z.uuid(), name: z.string(), description: z.string().nullable(),
  purpose: z.string().nullable(), handle: z.string().nullable(),
  visibility: z.enum(["unlisted", "public", "private"]), mode: z.enum(["flexible", "fixed"]),
  is_shared: z.boolean(), status: z.enum(["open", "active", "closed", "matured"]),
  target_amount: nullableMoneySchema, deadline: z.iso.date().nullable(), maturity_date: z.iso.date().nullable(),
  cowrywise_profile_id: z.uuid().nullable(), cowrywise_product_code: z.string().nullable(),
  cowrywise_investment_id: z.string().nullable(), principal: nullableMoneySchema,
  returns_amount: nullableMoneySchema, display_balance: nullableMoneySchema,
  available_balance: nullableMoneySchema, lock_status: z.enum(["unlocked", "lock_pending", "locked", "releasing", "released"]),
  locked_at: dateTimeSchema, lock_release_at: dateTimeSchema, lock_period_days: z.number().int().nullable(),
  lock_rate: z.string().nullable(), early_release_fee_percent: z.string().nullable(), locked_target: z.string().nullable(),
  closed_at: dateTimeSchema, closed_by_user_id: z.uuid().nullable(), closure_reason: z.string().nullable(),
  created_at: z.iso.datetime(), updated_at: z.iso.datetime(),
})

/** API request contract for creating an Aza; amounts stay exact decimal strings. */
export const azaCreateSchema = z.object({
  name: z.string().trim().min(1).max(120), description: z.string().max(500).nullable().optional(),
  purpose: z.string().max(500).nullable().optional(), handle: z.string().min(1).max(64).nullable().optional(),
  visibility: z.enum(["unlisted", "public", "private"]).default("unlisted"),
  mode: z.enum(["flexible", "fixed"]).default("flexible"), is_shared: z.boolean().optional(),
  target_amount: moneySchema.nullable().optional(), deadline: z.iso.date().nullable().optional(),
  maturity_date: z.iso.date().nullable().optional(), currency: z.literal("NGN").default("NGN"),
})

/** API request contract for updating customer-editable Aza details. */
export const azaUpdateSchema = azaCreateSchema.omit({ currency: true, is_shared: true }).partial()
export const azaIdSchema = z.uuid()

/** Aza invitation response and request contracts. */
export const inviteSchema = z.object({
  id: z.uuid(), aza_id: z.uuid(), invited_by_user_id: z.uuid(), invited_user_id: z.uuid().nullable(),
  email: z.email(), role: z.enum(["owner", "member"]),
  status: z.enum(["pending", "accepted", "declined", "revoked", "expired"]),
  expires_at: dateTimeSchema, responded_at: dateTimeSchema, created_at: z.iso.datetime(),
})
export const inviteCreateSchema = z.object({ email: z.email(), role: z.enum(["owner", "member"]).default("member"), expires_in_days: z.number().int().min(1).max(30).default(7) })
export const inviteTokenSchema = z.object({ invite_token: z.string().min(1) })
export const inviteIdSchema = z.uuid()

/** Member list returned for an Aza. */
export const azaMemberSchema = z.object({ user_id: z.uuid(), full_name: z.string(), email: z.email(), role: z.enum(["owner", "member"]) })
/** Confirmed Aza position reported by the API. */
export const azaPositionSchema = z.object({ aza_id: z.uuid(), confirmed_position: z.string().regex(/^-?\d+\.\d{2}$/) })

/** Backend contribution history contract. */
export const contributionSchema = z.object({
  id: z.uuid(), aza_id: z.uuid(), contributor_user_id: z.uuid(), source_type: z.string(),
  source_save_id: z.uuid().nullable(), source_pay_id: z.uuid().nullable(), funding_connection_id: z.uuid().nullable(),
  amount: moneySchema, currency: z.literal("NGN"), status: z.enum(["initiated", "collected", "confirmed", "reconciled", "void", "failed"]),
  collected_at: dateTimeSchema, confirmed_at: dateTimeSchema, reconciled_at: dateTimeSchema, created_at: z.iso.datetime(),
})
export const contributionCreateSchema = z.object({ funding_connection_id: z.uuid(), amount: moneySchema, memo: z.string().max(500).nullable().optional() })
/** PayOut returned when a contribution request starts its payment instruction. */
export const contributionInstructionSchema = z.object({
  id: z.uuid(), user_id: z.uuid(), flow_id: z.uuid(), category_id: z.uuid().nullable(),
  funding_connection_id: z.uuid().nullable(), funding_complete: z.boolean(), beneficiary_name: z.string(),
  destination_type: z.enum(["bank", "aza", "shared_aza"]), bank_code: z.string().nullable(), bank_name: z.string().nullable(),
  account_number: z.string().nullable(), aza_id: z.uuid().nullable(), amount: moneySchema, currency: z.literal("NGN"),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]).nullable(), day_of_month: z.number().int().nullable(),
  day_of_week: z.number().int().nullable(), next_run_at: dateTimeSchema, status: z.enum(["draft", "ready", "scheduled", "paused", "processing", "successful", "failed", "locked", "blocked_on_onboarding"]),
  destination_locked: z.boolean(), first_settled_at: dateTimeSchema, memo: z.string().nullable(),
  created_at: z.iso.datetime(), updated_at: z.iso.datetime(),
})

/** Backend-provided withdrawal quote and lifecycle state. Sensitive account fields are projected out before reaching UI. */
export const withdrawalSchema = z.object({
  id: z.uuid(), aza_id: z.uuid(), user_id: z.uuid(), idempotency_key: z.string(), transaction_id: z.string(),
  status: z.enum(["requested", "confirmed", "liquidating", "liquidated", "withdrawal_pending", "settled", "cancelled", "failed"]),
  gross_amount: moneySchema, fee_amount: moneySchema, net_amount: moneySchema, rate: z.string(), fee_flat: z.string(), fee_percent: z.string(),
  liquidity_mode: z.enum(["flexible", "fixed"]), min_settlement_days: z.number().int(), max_settlement_days: z.number().int(),
  available_at: z.iso.datetime(), destination_type: z.string(), beneficiary_name: z.string(), bank_code: z.string().nullable(),
  bank_name: z.string().nullable(), account_number: z.string().nullable(), account_name: z.string().nullable(),
  requested_at: z.iso.datetime(), confirmed_at: dateTimeSchema, liquidated_at: dateTimeSchema, settled_at: dateTimeSchema,
  cancelled_at: dateTimeSchema, failure_reason: z.string().nullable(), created_at: z.iso.datetime(), updated_at: z.iso.datetime(),
})
export const withdrawalRequestSchema = z.object({ amount: moneySchema, idempotency_key: z.string().min(8).max(120) })
export const maturedReleaseSchema = z.object({ idempotency_key: z.string().min(8).max(120) })
/** Bank destination details required to confirm a quoted withdrawal. */
export const withdrawalConfirmSchema = z.object({
  destination_type: z.literal("bank"), bank_code: z.string().min(1).max(20), bank_name: z.string().min(1).max(100),
  account_number: z.string().min(1).max(20), account_name: z.string().min(1).max(200),
  beneficiary_name: z.string().min(1).max(200), provider_bank_id: z.string().min(1).max(100),
})
export const closeAzaSchema = z.object({ reason: z.string().max(500).nullable().optional() })

export type Aza = z.infer<typeof azaSchema>
export type AzaCreateInput = z.infer<typeof azaCreateSchema>
export type AzaUpdateInput = z.infer<typeof azaUpdateSchema>
export type Invite = z.infer<typeof inviteSchema>
export type AzaMember = z.infer<typeof azaMemberSchema>
export type AzaPosition = z.infer<typeof azaPositionSchema>
export type Contribution = z.infer<typeof contributionSchema>
export type Withdrawal = z.infer<typeof withdrawalSchema>

/** Browser-safe withdrawal view; full account numbers and provider references never leave the server. */
export type WithdrawalView = Omit<Withdrawal, "account_number" | "idempotency_key" | "transaction_id"> & { readonly account_number_last4: string | null }
export function toWithdrawalView(withdrawal: Withdrawal): WithdrawalView {
  const { account_number, idempotency_key, transaction_id, ...safeWithdrawal } = withdrawal
  void idempotency_key
  void transaction_id
  return { ...safeWithdrawal, account_number_last4: account_number?.slice(-4) ?? null }
}
