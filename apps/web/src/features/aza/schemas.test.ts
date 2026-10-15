import { describe, expect, test } from "vitest"
import { azaCreateSchema, toWithdrawalView, withdrawalRequestSchema, withdrawalSchema } from "./schemas"

describe("Aza API contracts", () => {
  test("preserves two-decimal strings and rejects floating point money values", () => {
    expect(azaCreateSchema.safeParse({ name: "Rainy day", target_amount: "1250.00" }).success).toBe(true)
    expect(azaCreateSchema.safeParse({ name: "Rainy day", target_amount: 1250.25 }).success).toBe(false)
    expect(withdrawalRequestSchema.safeParse({ amount: "100.5", idempotency_key: "request-key-123" }).success).toBe(false)
  })

  test("removes full account numbers and internal idempotency references from browser views", () => {
    const withdrawal = withdrawalSchema.parse({
      id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0", aza_id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
      user_id: "4f6e92bb-8220-4360-93f6-8399cfc9a903", idempotency_key: "internal-secret-key", transaction_id: "txn-private",
      status: "requested", gross_amount: "100.00", fee_amount: "2.00", net_amount: "98.00", rate: "1.00",
      fee_flat: "1.00", fee_percent: "1.00", liquidity_mode: "flexible", min_settlement_days: 1,
      max_settlement_days: 3, available_at: "2026-10-13T12:00:00Z", destination_type: "bank", beneficiary_name: "A Customer",
      bank_code: "001", bank_name: "Example Bank", account_number: "0123456789", account_name: "A Customer",
      requested_at: "2026-10-13T12:00:00Z", confirmed_at: null, liquidated_at: null, settled_at: null,
      cancelled_at: null, failure_reason: null, created_at: "2026-10-13T12:00:00Z", updated_at: "2026-10-13T12:00:00Z",
    })
    const view = toWithdrawalView(withdrawal)
    expect(view).not.toHaveProperty("account_number")
    expect(view).not.toHaveProperty("idempotency_key")
    expect(view).not.toHaveProperty("transaction_id")
    expect(view.account_number_last4).toBe("6789")
  })
})
