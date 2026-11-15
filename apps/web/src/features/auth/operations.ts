import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import { userSchema, type User } from "./schemas"

/** Read the AzaPay principal associated with the Clerk bearer token. */
export function* currentUser(): Operation<Outcome<User>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(http("/v1/auth/me", { signal }))

    if (!response.ok) return left({ kind: "transport", operation: "whoami" })

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "whoami",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, userSchema))

    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "whoami" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "whoami" })
  }
}
