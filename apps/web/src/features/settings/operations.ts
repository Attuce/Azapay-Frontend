import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import { userSchema, type User } from "../auth/schemas"
import {
  profileUpdateSchema,
  settingsSchema,
  settingsUpdateSchema,
  type ProfileUpdate,
  type Settings,
  type SettingsUpdate,
} from "./schemas"

/** Read the customer's editable profile through the authenticated Jamx handler. */
export function* getProfile(): Operation<Outcome<User>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/users/me", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "get-profile" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "get-profile",
        status: response.value.status,
      })
    }
    const validated = yield* until(
      validate(yield* until(json(response.value)), userSchema)
    )
    return validated.ok
      ? right(validated.value)
      : left({ kind: "invalid-response", operation: "get-profile" })
  } catch {
    return left({ kind: "transport", operation: "get-profile" })
  }
}

/** Update only profile fields supported by the API contract. */
export function* updateProfile(input: ProfileUpdate): Operation<Outcome<User>> {
  const request = profileUpdateSchema.safeParse(input)
  if (!request.success) {
    return left({ kind: "invalid-request", operation: "update-profile" })
  }
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(
      http("/v1/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )
    if (!response.ok) {
      return left({ kind: "transport", operation: "update-profile" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "update-profile",
        status: response.value.status,
      })
    }
    const validated = yield* until(
      validate(yield* until(json(response.value)), userSchema)
    )
    return validated.ok
      ? right(validated.value)
      : left({ kind: "invalid-response", operation: "update-profile" })
  } catch {
    return left({ kind: "transport", operation: "update-profile" })
  }
}

/** Read the customer's notification and timezone preferences. */
export function* getSettings(): Operation<Outcome<Settings>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http("/v1/settings", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "get-settings" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "get-settings",
        status: response.value.status,
      })
    }
    const validated = yield* until(
      validate(yield* until(json(response.value)), settingsSchema)
    )
    return validated.ok
      ? right(validated.value)
      : left({ kind: "invalid-response", operation: "get-settings" })
  } catch {
    return left({ kind: "transport", operation: "get-settings" })
  }
}

/** Update only preferences supported by the API contract. */
export function* updateSettings(
  input: SettingsUpdate
): Operation<Outcome<Settings>> {
  const request = settingsUpdateSchema.safeParse(input)
  if (!request.success) {
    return left({ kind: "invalid-request", operation: "update-settings" })
  }
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(
      http("/v1/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )
    if (!response.ok) {
      return left({ kind: "transport", operation: "update-settings" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "update-settings",
        status: response.value.status,
      })
    }
    const validated = yield* until(
      validate(yield* until(json(response.value)), settingsSchema)
    )
    return validated.ok
      ? right(validated.value)
      : left({ kind: "invalid-response", operation: "update-settings" })
  } catch {
    return left({ kind: "transport", operation: "update-settings" })
  }
}
