import { z } from "zod"

const moneySchema = z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/)

/** AnalyticsOverview from AzaPay OpenAPI 0.4.0. */
export const overviewSchema = z.object({
  generated_at: z.iso.datetime(),
  categories: z.number().int(),
  active_categories: z.number().int(),
  azas: z.number().int(),
  total_allocated_per_run: moneySchema,
  total_executed: moneySchema,
  total_fees: moneySchema,
  total_saved: moneySchema,
  total_returns: moneySchema,
  open_reconciliation_events: z.number().int(),
  failed_executions: z.number().int(),
})

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

/** CategoryOut values shown in the read-only Flow summary. */
export const categorySchema = z.object({
  id: z.uuid(),
  domain_side: z.enum(["flow", "aza"]),
  name: z.string(),
  description: z.string().nullable(),
  amount_per_run: moneySchema,
  currency: z.literal("NGN"),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]),
  next_run_at: z.iso.datetime().nullable(),
  status: z.enum(["active", "paused", "archived"]),
  has_funding: z.boolean(),
})

/** AuditEventPage from the immutable customer activity trail. */
export const activitySchema = z.object({
  total: z.number().int(),
  rows: z.array(
    z.object({
      id: z.string(),
      actor_type: z.string(),
      action: z.string(),
      entity_type: z.string(),
      entity_id: z.string().nullable(),
      transaction_id: z.string().nullable(),
      context: z.record(z.string(), z.unknown()).nullable(),
      created_at: z.string(),
    })
  ),
})

export type Overview = z.infer<typeof overviewSchema>
export type Flow = z.infer<typeof flowSchema>
export type Category = z.infer<typeof categorySchema>
export type Activity = z.infer<typeof activitySchema>
