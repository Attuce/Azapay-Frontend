import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  categoryIdSchema,
  categoryConnectSchema,
  categorySchema,
  flowConnectSchema,
  flowIdSchema,
  flowCategoryAmountSchema,
  flowCategoryCreateSchema,
  flowCategoryUpdateSchema,
  flowSchema,
  flowUpdateSchema,
  flowUpcomingSchema,
  flowHistorySchema,
  type Category,
  type Flow,
  type FlowCategoryCreate,
  type FlowCategoryUpdate,
  type FlowUpdate,
  type FlowUpcoming,
  type FlowHistory,
} from "./schemas"

/** Update the customer's Flow name, description, or account-level status. */
export function* updateFlow(input: FlowUpdate): Operation<Outcome<Flow>> {
  const request = flowUpdateSchema.safeParse(input)
  if (!request.success) return left({ kind: "invalid-request", operation: "update-flow" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/flows/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "update-flow" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "update-flow", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "update-flow" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-flow" })
  }
}

/** Read the backend-provisioned Flow domain for the authenticated customer. */
export function* getFlow(): Operation<Outcome<Flow>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/flows/me", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "get-flow" })
    if (!response.value.ok) {
      return left({ kind: "http-status", operation: "get-flow", status: response.value.status })
    }
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "get-flow" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-flow" })
  }
}

/** Attach or clear the Flow's backend-managed default funding source. */
export function* connectFlow(
  flowId: string,
  fundingConnectionId: string | null
): Operation<Outcome<Flow>> {
  const id = flowIdSchema.safeParse(flowId)
  const request = flowConnectSchema.safeParse({ funding_connection_id: fundingConnectionId })
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "connect-flow" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/flows/${id.data}/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "connect-flow" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "connect-flow", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "connect-flow" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "connect-flow" })
  }
}

/** Attach or clear a category's backend-managed default funding source. */
export function* connectFlowCategory(
  categoryId: string,
  fundingConnectionId: string | null
): Operation<Outcome<Category>> {
  const id = categoryIdSchema.safeParse(categoryId)
  const request = categoryConnectSchema.safeParse({ funding_connection_id: fundingConnectionId })
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "connect-flow-category" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/categories/${id.data}/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "connect-flow-category" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "connect-flow-category", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "connect-flow-category" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "connect-flow-category" })
  }
}

/** Read the API's upcoming Flow runs, readiness gates, and funding state. */
export function* getFlowUpcoming(flowId: string): Operation<Outcome<FlowUpcoming[]>> {
  const id = flowIdSchema.safeParse(flowId)
  if (!id.success) return left({ kind: "invalid-request", operation: "get-flow-upcoming" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/flows/${id.data}/upcoming`, { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "get-flow-upcoming" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "get-flow-upcoming", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowUpcomingSchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "get-flow-upcoming" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-flow-upcoming" })
  }
}

/** Read backend-owned amounts, fees, destinations, outcomes, and recovery history for a Flow. */
export function* getFlowHistory(flowId: string): Operation<Outcome<FlowHistory[]>> {
  const id = flowIdSchema.safeParse(flowId)
  if (!id.success) return left({ kind: "invalid-request", operation: "get-flow-history" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/flows/${id.data}/history`, { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "get-flow-history" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "get-flow-history", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowHistorySchema.array()))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "get-flow-history" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-flow-history" })
  }
}

/** Create a Flow spending or saving instruction through the category contract. */
export function* createFlowCategory(input: FlowCategoryCreate): Operation<Outcome<Category>> {
  const request = flowCategoryCreateSchema.safeParse(input)
  if (!request.success) return left({ kind: "invalid-request", operation: "create-flow-category" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "create-flow-category" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "create-flow-category", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "create-flow-category" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "create-flow-category" })
  }
}

/** Update the future schedule or status of a Flow instruction. */
export function* updateFlowCategory(categoryId: string, input: FlowCategoryUpdate): Operation<Outcome<Category>> {
  const id = categoryIdSchema.safeParse(categoryId)
  const request = flowCategoryUpdateSchema.safeParse(input)
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "update-flow-category" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/categories/${id.data}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "update-flow-category" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "update-flow-category", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "update-flow-category" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-flow-category" })
  }
}

/** Change only an instruction's amount using the backend's dedicated endpoint. */
export function* updateFlowCategoryAmount(categoryId: string, amount: string): Operation<Outcome<Category>> {
  const id = categoryIdSchema.safeParse(categoryId)
  const request = flowCategoryAmountSchema.safeParse({ amount_per_run: amount })
  if (!id.success || !request.success) return left({ kind: "invalid-request", operation: "update-flow-category-amount" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/categories/${id.data}/amount`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
      signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation: "update-flow-category-amount" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "update-flow-category-amount", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "update-flow-category-amount" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-flow-category-amount" })
  }
}

/** Archive a Flow instruction using the API's soft-delete operation. */
export function* archiveFlowCategory(categoryId: string): Operation<Outcome<Category>> {
  const id = categoryIdSchema.safeParse(categoryId)
  if (!id.success) return left({ kind: "invalid-request", operation: "archive-flow-category" })
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(`/v1/categories/${id.data}`, { method: "DELETE", signal }))
    if (!response.ok) return left({ kind: "transport", operation: "archive-flow-category" })
    if (!response.value.ok) return left({ kind: "http-status", operation: "archive-flow-category", status: response.value.status })
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema))
    if (!validated.ok) return left({ kind: "invalid-response", operation: "archive-flow-category" })
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "archive-flow-category" })
  }
}
