import { z } from "zod"

const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/)

/** FlowOut returned by the customer's spending-domain endpoint. */
export const flowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  currency: z.literal("NGN"),
  status: z.enum(["active", "paused", "archived"]),
  default_funding_connection_id: z.uuid().nullable(),
  has_funding: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** FlowUpdateIn request schema supported by the AzaPay API. */
export const flowUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "paused", "archived"]).nullable().optional(),
})

/** FlowConnectIn body; null clears the domain's default funding source. */
export const flowConnectSchema = z.object({
  funding_connection_id: z.uuid().nullable(),
})

/** CategoryOut returned by the AzaPay API for Flow and Aza instructions. */
export const categorySchema = z.object({
  id: z.uuid(),
  domain_side: z.enum(["flow", "aza"]),
  flow_id: z.uuid().nullable(),
  aza_id: z.uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  amount_per_run: moneySchema,
  currency: z.literal("NGN"),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]),
  day_of_month: z.number().int().nullable(),
  day_of_week: z.number().int().nullable(),
  next_run_at: z.iso.datetime().nullable(),
  timezone: z.string(),
  status: z.enum(["active", "paused", "archived"]),
  default_funding_connection_id: z.uuid().nullable(),
  has_funding: z.boolean(),
  archived_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

/** CategoryCreateIn request shape limited to the customer's Flow domain. */
export const flowCategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  amount_per_run: z.string().regex(/^(?=.*[1-9])\d{1,16}\.\d{2}$/),
  currency: z.literal("NGN").default("NGN"),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]).default("monthly"),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  timezone: z.string().default("Africa/Lagos"),
  domain_side: z.literal("flow"),
})

/** CategoryUpdateIn supported by the API; changes apply to future runs. */
export const flowCategoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  next_run_at: z.iso.datetime().nullable().optional(),
  status: z.enum(["active", "paused", "archived"]).nullable().optional(),
})

/** Dedicated amount update request; monetary values remain two-decimal strings. */
export const flowCategoryAmountSchema = z.object({
  amount_per_run: z.string().regex(/^(?=.*[1-9])\d{1,16}\.\d{2}$/),
})

/** UUID path parameter for a category the authenticated customer manages. */
export const categoryIdSchema = z.uuid()

/** Flow UUID path parameter for Flow-scoped operations. */
export const flowIdSchema = z.uuid()

/** CategoryConnectIn body; null clears the instruction's default source. */
export const categoryConnectSchema = z.object({
  funding_connection_id: z.uuid().nullable(),
})

/** Readiness gates returned by the backend for each upcoming Flow run. */
export const flowUpcomingReadinessSchema = z.object({
  flow_active: z.boolean(),
  category_active: z.boolean(),
  has_destinations: z.boolean(),
  conserves: z.boolean(),
  funded: z.boolean(),
  ready: z.boolean(),
  issues: z.array(z.string()).default([]),
})

/** Funding status returned with an upcoming Flow run. */
export const flowUpcomingFundingSchema = z.object({
  funding_connection_id: z.uuid().nullable().optional(),
  provider: z.string().nullable().optional(),
  kind: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  account_number_last4: z.string().nullable().optional(),
  fundable: z.boolean().default(false),
  message: z.string().nullable().optional(),
})

/** Destination detail from the backend's upcoming-run preview. */
export const flowUpcomingDestinationSchema = z.object({
  pay_id: z.uuid(),
  beneficiary_name: z.string().nullable().optional(),
  destination_type: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_code: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  aza_id: z.uuid().nullable().optional(),
  amount: moneySchema.nullable().optional(),
})

/** Upcoming scheduled instruction returned by the Flow preview endpoint. */
export const flowUpcomingSchema = z.object({
  category_id: z.uuid(),
  category_name: z.string(),
  next_run_at: z.iso.datetime(),
  overdue: z.boolean(),
  amount: moneySchema,
  currency: z.literal("NGN"),
  frequency: z.string(),
  destinations: z.array(flowUpcomingDestinationSchema),
  readiness: flowUpcomingReadinessSchema,
  funding: flowUpcomingFundingSchema,
})

/** Destination and payment details for one child of a completed Flow run. */
export const flowHistoryChildSchema = z.object({
  id: z.uuid(),
  pay_id: z.uuid().nullable(),
  amount: moneySchema,
  status: z.string(),
  attempt: z.number().int(),
  beneficiary_name: z.string().nullable().optional(),
  destination_type: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  account_name: z.string().nullable().optional(),
  aza_id: z.uuid().nullable().optional(),
  item_status: z.string().nullable().optional(),
  item_failure_reason: z.string().nullable().optional(),
  provider_reference: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  attempt_count: z.number().int().nullable().optional(),
  succeeded_at: z.iso.datetime().nullable().optional(),
  recovery_status: z.enum(["recovered", "failed", "pending"]).nullable().optional(),
})

/** Backend record for one Flow instruction run and its settlement/recovery history. */
export const flowHistorySchema = z.object({
  id: z.uuid(),
  category_id: z.uuid(),
  category_name: z.string(),
  total_amount: moneySchema,
  fee: moneySchema,
  currency: z.literal("NGN"),
  status: z.string(),
  collection_reference: z.string().nullable().optional(),
  scheduled_for: z.iso.datetime().nullable().optional(),
  collected_at: z.iso.datetime().nullable().optional(),
  settled_at: z.iso.datetime().nullable().optional(),
  failed_at: z.iso.datetime().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  recovery_attempts: z.number().int().nullable().optional(),
  recovered_at: z.iso.datetime().nullable().optional(),
  recovery_status: z.enum(["recovering", "recovered", "failed", "none"]).default("none"),
  created_at: z.iso.datetime(),
  children: z.array(flowHistoryChildSchema),
})

/** Validated backend representation of a Flow or Aza category. */
export type Category = z.infer<typeof categorySchema>
/** Validated backend representation of the customer's Flow domain. */
export type Flow = z.infer<typeof flowSchema>

/** Partial Flow changes supported by the backend. */
export type FlowUpdate = z.infer<typeof flowUpdateSchema>
/** Validated backend result for one upcoming Flow run. */
export type FlowUpcoming = z.infer<typeof flowUpcomingSchema>
/** Validated backend representation of a Flow instruction run. */
export type FlowHistory = z.infer<typeof flowHistorySchema>

/** Browser-safe upcoming-run view with full destination account numbers removed. */
export type FlowUpcomingView = Omit<FlowUpcoming, "destinations"> & {
  readonly destinations: Array<Omit<FlowUpcoming["destinations"][number], "account_number">>
}

/** Browser-safe run history with full destination account numbers removed. */
export type FlowHistoryView = Omit<FlowHistory, "children"> & {
  readonly children: Array<Omit<FlowHistory["children"][number], "account_number">>
}

/** Customer input accepted when creating a Flow category. */
export type FlowCategoryCreate = z.input<typeof flowCategoryCreateSchema>

/** Partial category changes accepted by the backend for future runs. */
export type FlowCategoryUpdate = z.infer<typeof flowCategoryUpdateSchema>
