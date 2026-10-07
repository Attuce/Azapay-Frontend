import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  activitySchema,
  categorySchema,
  flowSchema,
  overviewSchema,
  type Activity,
  type Category,
  type Flow,
  type Overview,
} from "./schemas"

/** Read the backend's whole-account financial snapshot. */
export function* getOverview(): Operation<Outcome<Overview>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/analytics/overview", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "get-overview" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "get-overview",
        status: response.value.status,
      })
    }
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, overviewSchema))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "get-overview" })
    }
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-overview" })
  }
}

/** Read the customer's backend-provisioned Flow spending domain. */
export function* getFlow(): Operation<Outcome<Flow>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/flows/me", { signal }))
    if (!response.ok) return left({ kind: "transport", operation: "get-flow" })
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "get-flow",
        status: response.value.status,
      })
    }
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, flowSchema))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "get-flow" })
    }
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-flow" })
  }
}

/** List all categories; the screen presents the Flow-owned entries. */
export function* listCategories(): Operation<Outcome<Category[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/categories", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "list-categories" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "list-categories",
        status: response.value.status,
      })
    }
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, categorySchema.array()))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "list-categories" })
    }
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-categories" })
  }
}

/** Read the first page of immutable customer activity. */
export function* listActivity(): Operation<Outcome<Activity>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/audit/events?limit=8", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "list-activity" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "list-activity",
        status: response.value.status,
      })
    }
    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, activitySchema))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "list-activity" })
    }
    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-activity" })
  }
}
