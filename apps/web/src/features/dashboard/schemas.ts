import { z } from "zod"
import { categorySchema, type Category } from "../flow/schemas"

export { categorySchema }
export type { Category }

const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/)

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
export type Activity = z.infer<typeof activitySchema>
