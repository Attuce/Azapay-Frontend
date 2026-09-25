import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import type { z } from "zod"
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

function* requestJson<T>(
  operation: string,
  path: string,
  accessToken: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Operation<Outcome<T>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http(path, {
        ...init,
        headers: {
          authorization: `Bearer ${accessToken}`,
          ...init?.headers,
        },
        signal,
      })
    )

    if (!response.ok) return left({ kind: "transport", operation })
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation,
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, schema))
    if (!validated.ok) return left({ kind: "invalid-response", operation })

    return right(validated.value as T)
  } catch {
    return left({ kind: "transport", operation })
  }
}

/** Read the customer's editable profile. */
export function* getProfile(accessToken: string): Operation<Outcome<User>> {
  return yield* requestJson<User>(
    "get-profile",
    "/v1/users/me",
    accessToken,
    userSchema
  )
}

/** Update only profile fields supported by the API contract. */
export function* updateProfile(
  accessToken: string,
  input: ProfileUpdate
): Operation<Outcome<User>> {
  const request = profileUpdateSchema.safeParse(input)
  if (!request.success) {
    return left({ kind: "invalid-request", operation: "update-profile" })
  }

  return yield* requestJson<User>(
    "update-profile",
    "/v1/users/me",
    accessToken,
    userSchema,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
    }
  )
}

/** Read the customer's notification and timezone preferences. */
export function* getSettings(
  accessToken: string
): Operation<Outcome<Settings>> {
  return yield* requestJson<Settings>(
    "get-settings",
    "/v1/settings",
    accessToken,
    settingsSchema
  )
}

/** Update only preferences supported by the API contract. */
export function* updateSettings(
  accessToken: string,
  input: SettingsUpdate
): Operation<Outcome<Settings>> {
  const request = settingsUpdateSchema.safeParse(input)
  if (!request.success) {
    return left({ kind: "invalid-request", operation: "update-settings" })
  }

  return yield* requestJson<Settings>(
    "update-settings",
    "/v1/settings",
    accessToken,
    settingsSchema,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
    }
  )
}
