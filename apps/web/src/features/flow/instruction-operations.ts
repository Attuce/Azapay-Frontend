import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  flowAzaOptionSchema,
  flowBankSchema,
  flowPayCreateSchema,
  flowPayDestinationSchema,
  flowPayIdSchema,
  flowPaySchema,
  flowPayUpdateSchema,
  flowSaveCreateSchema,
  flowSaveIdSchema,
  flowSaveSchema,
  flowSaveUpdateSchema,
  type FlowAzaOption,
  type FlowBank,
  type FlowPay,
  type FlowPayCreate,
  type FlowPayDestination,
  type FlowPayUpdate,
  type FlowSave,
  type FlowSaveCreate,
  type FlowSaveUpdate,
} from "./instruction-schemas"

/** List the customer's existing Azas using only fields needed for save selection. */
export function* listFlowAzaOptions(): Operation<Outcome<FlowAzaOption[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/azas", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "list-flow-aza-options" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "list-flow-aza-options", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowAzaOptionSchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "list-flow-aza-options" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-flow-aza-options" })
  }
}

/** List API-supported Nigerian bank destinations for payment instructions. */
export function* listFlowBanks(): Operation<Outcome<FlowBank[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/banks", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "list-flow-banks" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "list-flow-banks", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowBankSchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "list-flow-banks" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-flow-banks" })
  }
}

/** List payment instructions for the customer's Flow domain. */
export function* listFlowPays(): Operation<Outcome<FlowPay[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/pays", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "list-flow-pays" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "list-flow-pays", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowPaySchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "list-flow-pays" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-flow-pays" })
  }
}

/** List savings instructions for the customer's Flow domain. */
export function* listFlowSaves(): Operation<Outcome<FlowSave[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/saves", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "list-flow-saves" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "list-flow-saves", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSaveSchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "list-flow-saves" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-flow-saves" })
  }
}

/** Create a bank or Aza payment instruction through the documented endpoint. */
export function* createFlowPay(input: FlowPayCreate): Operation<Outcome<FlowPay>> {
  const request = flowPayCreateSchema.safeParse(input)
  if (!request.success) return left({ kind: "invalid-request", operation: "create-flow-pay" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/pays", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "create-flow-pay" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "create-flow-pay", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowPaySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "create-flow-pay" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "create-flow-pay" })
  }
}

/** Update a payment instruction; destination changes are guarded by the API after settlement. */
export function* updateFlowPay(payId: string, input: FlowPayUpdate): Operation<Outcome<FlowPay>> {
  const id = flowPayIdSchema.safeParse(payId)
  const request = flowPayUpdateSchema.safeParse(input)
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "update-flow-pay" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/pays/${id.data}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "update-flow-pay" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "update-flow-pay", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowPaySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "update-flow-pay" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-flow-pay" })
  }
}

/** Resolve a selected bank name server-side, then update the payment destination. */
export function* updateFlowPayDestination(payId: string, input: FlowPayDestination): Operation<Outcome<FlowPay>> {
  const destination = flowPayDestinationSchema.safeParse(input)
  if (!destination.success) return left({ kind: "invalid-request", operation: "update-flow-pay-destination" })
  let bankName: string | undefined
  if (destination.data.destination_type === "bank" && destination.data.bank_code) {
    const banks = yield* listFlowBanks()
    if (banks._tag === "Left") return banks
    bankName = banks.right.find((bank) => bank.code === destination.data.bank_code)?.name
    if (!bankName) return left({ kind: "invalid-request", operation: "update-flow-pay-destination" })
  }
  return yield* updateFlowPay(payId, {
    destination_type: destination.data.destination_type,
    aza_id: destination.data.destination_type === "bank" ? null : destination.data.aza_id,
    bank_code: destination.data.destination_type === "bank" ? destination.data.bank_code : null,
    bank_name: bankName ?? null,
    account_number: destination.data.destination_type === "bank" ? destination.data.account_number : null,
  })
}

/** Pause a payment instruction without replaying the request. */
export function* pauseFlowPay(payId: string): Operation<Outcome<FlowPay>> {
  return yield* transitionFlowPay(payId, "pause")
}

/** Activate a payment instruction according to backend readiness rules. */
export function* activateFlowPay(payId: string): Operation<Outcome<FlowPay>> {
  return yield* transitionFlowPay(payId, "activate")
}

function* transitionFlowPay(payId: string, action: "pause" | "activate"): Operation<Outcome<FlowPay>> {
  const id = flowPayIdSchema.safeParse(payId)
  if (!id.success) return left({ kind: "invalid-request", operation: `flow-pay-${action}` })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/pays/${id.data}/${action}`, { method: "POST", signal }))
    if (!response.ok) return left({ kind: "transport", operation: `flow-pay-${action}` })
    if (!response.value.ok) return left({ kind: "http-status", operation: `flow-pay-${action}`, status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowPaySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: `flow-pay-${action}` })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: `flow-pay-${action}` })
  }
}

/** Create a savings instruction linked to an existing Aza and Flow category. */
export function* createFlowSave(input: FlowSaveCreate): Operation<Outcome<FlowSave>> {
  const request = flowSaveCreateSchema.safeParse(input)
  if (!request.success) return left({ kind: "invalid-request", operation: "create-flow-save" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/saves", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "create-flow-save" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "create-flow-save", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSaveSchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "create-flow-save" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "create-flow-save" })
  }
}

/** Update a savings instruction's schedule, amount, lock, or backend status. */
export function* updateFlowSave(saveId: string, input: FlowSaveUpdate): Operation<Outcome<FlowSave>> {
  const id = flowSaveIdSchema.safeParse(saveId)
  const request = flowSaveUpdateSchema.safeParse(input)
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "update-flow-save" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/saves/${id.data}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "update-flow-save" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "update-flow-save", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSaveSchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "update-flow-save" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-flow-save" })
  }
}
