import { z } from "zod"

const moneySchema = z.string().regex(/^(?=.*[1-9])\d{1,16}\.\d{2}$/)
const nullableUuid = z.uuid().nullable()
const frequencySchema = z.enum(["once", "daily", "weekly", "monthly"])
const statusSchema = z.enum(["draft", "ready", "scheduled", "paused", "processing", "successful", "failed", "locked", "blocked_on_onboarding"])

/** UUID path parameter for a payment instruction. */
export const flowPayIdSchema = z.uuid()
/** UUID path parameter for a savings instruction. */
export const flowSaveIdSchema = z.uuid()

/** Request contract for a bank or Aza payment instruction attached to Flow. */
export const flowPayCreateSchema = z.object({
  category_id: nullableUuid,
  funding_connection_id: nullableUuid,
  beneficiary_name: z.string().trim().min(1).max(200),
  amount: moneySchema,
  currency: z.literal("NGN").default("NGN"),
  destination_type: z.enum(["bank", "aza", "shared_aza"]),
  aza_id: nullableUuid.optional(),
  bank_code: z.string().max(20).nullable().optional(),
  bank_name: z.string().max(100).nullable().optional(),
  account_number: z.string().regex(/^\d{10}$/).nullable().optional(),
  frequency: frequencySchema.nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  next_run_at: z.iso.datetime().nullable().optional(),
  timezone: z.string().nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
}).superRefine((input, context) => {
  if (input.destination_type === "bank" && (!input.bank_code || !input.account_number)) {
    context.addIssue({ code: "custom", path: ["account_number"], message: "A bank and ten-digit account number are required." })
  }
  if (input.destination_type !== "bank" && !input.aza_id) {
    context.addIssue({ code: "custom", path: ["aza_id"], message: "Choose an Aza destination." })
  }
})

/** Partial update contract for an existing Flow payment instruction. */
export const flowPayUpdateSchema = z.object({
  beneficiary_name: z.string().trim().min(1).max(200).nullable().optional(),
  amount: moneySchema.nullable().optional(),
  status: statusSchema.nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
  frequency: frequencySchema.nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  timezone: z.string().max(64).nullable().optional(),
  funding_connection_id: nullableUuid.optional(),
  destination_type: z.enum(["bank", "aza", "shared_aza"]).nullable().optional(),
  aza_id: nullableUuid.optional(),
  bank_code: z.string().max(20).nullable().optional(),
  bank_name: z.string().max(100).nullable().optional(),
  account_number: z.string().regex(/^\d{10}$/).nullable().optional(),
})

/** Destination-only edit; bank and Aza fields are selected from current API data. */
export const flowPayDestinationSchema = z.object({
  destination_type: z.enum(["bank", "aza", "shared_aza"]),
  aza_id: nullableUuid,
  bank_code: z.string().max(20).nullable(),
  account_number: z.string().regex(/^\d{10}$/).nullable(),
}).superRefine((input, context) => {
  if (input.destination_type === "bank" && (!input.bank_code || !input.account_number)) {
    context.addIssue({ code: "custom", path: ["account_number"], message: "Bank code and account number are required." })
  }
  if (input.destination_type !== "bank" && !input.aza_id) {
    context.addIssue({ code: "custom", path: ["aza_id"], message: "An Aza destination is required." })
  }
})

/** Validated payment instruction returned by the AzaPay API. */
export const flowPaySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  flow_id: z.uuid(),
  category_id: nullableUuid,
  funding_connection_id: nullableUuid,
  funding_complete: z.boolean(),
  beneficiary_name: z.string(),
  destination_type: z.enum(["bank", "aza", "shared_aza"]),
  bank_code: z.string().nullable(),
  bank_name: z.string().nullable(),
  account_number: z.string().nullable(),
  aza_id: nullableUuid,
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.literal("NGN"),
  frequency: frequencySchema.nullable(),
  day_of_month: z.number().int().nullable(),
  day_of_week: z.number().int().nullable(),
  next_run_at: z.iso.datetime().nullable(),
  status: statusSchema,
  destination_locked: z.boolean(),
  first_settled_at: z.iso.datetime().nullable(),
  memo: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** Request contract for creating a savings instruction for an existing Aza. */
export const flowSaveCreateSchema = z.object({
  aza_id: z.uuid(),
  category_id: nullableUuid,
  funding_connection_id: nullableUuid,
  mode: z.enum(["amount", "share"]).default("amount"),
  share_percent: z.string().regex(/^(?:\d{1,3})(?:\.\d{1,6})?$/).nullable().optional(),
  amount: moneySchema.nullable().optional(),
  currency: z.literal("NGN").default("NGN"),
  trigger: z.enum(["scheduled", "manual", "payday"]).default("scheduled"),
  locked: z.boolean().default(false),
  locked_until: z.iso.datetime().nullable().optional(),
  frequency: frequencySchema.nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  next_run_at: z.iso.datetime().nullable().optional(),
  timezone: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(120).nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
}).superRefine((input, context) => {
  if (input.mode === "amount" && !input.amount) {
    context.addIssue({ code: "custom", path: ["amount"], message: "Enter an amount for a fixed-amount save." })
  }
  if (input.mode === "share" && !input.share_percent) {
    context.addIssue({ code: "custom", path: ["share_percent"], message: "Enter a share percentage." })
  }
})

/** Partial update contract for an existing Flow savings instruction. */
export const flowSaveUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  amount: moneySchema.nullable().optional(),
  mode: z.enum(["amount", "share"]).nullable().optional(),
  share_percent: z.string().regex(/^(?:\d{1,3})(?:\.\d{1,6})?$/).nullable().optional(),
  trigger: z.enum(["scheduled", "manual", "payday"]).nullable().optional(),
  locked: z.boolean().nullable().optional(),
  locked_until: z.iso.datetime().nullable().optional(),
  frequency: frequencySchema.nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  next_run_at: z.iso.datetime().nullable().optional(),
  timezone: z.string().nullable().optional(),
  status: statusSchema.nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
  category_id: nullableUuid.optional(),
  aza_id: z.uuid().nullable().optional(),
  funding_connection_id: nullableUuid.optional(),
})

/** Validated savings instruction returned by the AzaPay API. */
export const flowSaveSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  aza_id: z.uuid(),
  category_id: nullableUuid,
  funding_connection_id: nullableUuid,
  funding_complete: z.boolean(),
  mode: z.enum(["amount", "share"]),
  share_percent: z.string().nullable(),
  trigger: z.enum(["scheduled", "manual", "payday"]),
  locked: z.boolean(),
  locked_until: z.iso.datetime().nullable(),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.literal("NGN"),
  frequency: frequencySchema.nullable(),
  day_of_month: z.number().int().nullable(),
  day_of_week: z.number().int().nullable(),
  next_run_at: z.iso.datetime().nullable(),
  status: statusSchema,
  paused: z.boolean(),
  destination_locked: z.boolean(),
  first_settled_at: z.iso.datetime().nullable(),
  name: z.string().nullable(),
  memo: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** Minimal backend fields used to choose an existing Aza as a save destination. */
export const flowAzaOptionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: z.string(),
})

/** Bank choices returned by AzaPay for bank-destination payment instructions. */
export const flowBankSchema = z.object({ code: z.string(), name: z.string() })

/** Validated backend representation of a Flow payment instruction. */
export type FlowPay = z.infer<typeof flowPaySchema>
/** Client-safe payment instruction with full bank account numbers removed. */
export type FlowPayView = Omit<FlowPay, "account_number">
/** Validated backend representation of a Flow savings instruction. */
export type FlowSave = z.infer<typeof flowSaveSchema>
/** Validated Aza fields shown when choosing a savings destination. */
export type FlowAzaOption = z.infer<typeof flowAzaOptionSchema>
/** Validated bank label and provider code. */
export type FlowBank = z.infer<typeof flowBankSchema>
/** Validated create request for a Flow payment instruction. */
export type FlowPayCreate = z.input<typeof flowPayCreateSchema>
/** Validated partial update for a Flow payment instruction. */
export type FlowPayUpdate = z.infer<typeof flowPayUpdateSchema>
/** Validated destination change for a payment instruction. */
export type FlowPayDestination = z.infer<typeof flowPayDestinationSchema>
/** Validated create request for a Flow savings instruction. */
export type FlowSaveCreate = z.input<typeof flowSaveCreateSchema>
/** Validated partial update for a Flow savings instruction. */
export type FlowSaveUpdate = z.infer<typeof flowSaveUpdateSchema>

/** Remove full bank account details before a payment record enters the browser tree. */
export function toFlowPayView(pay: FlowPay): FlowPayView {
  const { account_number, ...safePay } = pay
  void account_number
  return safePay
}
