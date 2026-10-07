import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  authSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  tokenPairSchema,
  userSchema,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
  type AuthResult,
  type TokenPair,
  type User,
} from "./schemas"

/** Exchange login credentials for the backend's token pair and current user. */
export function* signIn(input: LoginInput): Operation<Outcome<AuthResult>> {
  const request = loginSchema.safeParse(input)

  if (!request.success) {
    return left({ kind: "invalid-request", operation: "login" })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) return left({ kind: "transport", operation: "login" })

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "login",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, authSchema))

    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "login" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "login" })
  }
}

/** Rotate an expiring session without replaying any customer action. */
export function* refreshTokens(
  input: RefreshInput
): Operation<Outcome<TokenPair>> {
  const request = refreshSchema.safeParse(input)

  if (!request.success) {
    return left({ kind: "invalid-request", operation: "refresh" })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) return left({ kind: "transport", operation: "refresh" })

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "refresh",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, tokenPairSchema))

    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "refresh" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "refresh" })
  }
}

/** Create an account with the required RegisterIn fields. */
export function* register(
  input: RegisterInput
): Operation<Outcome<AuthResult>> {
  const request = registerSchema.safeParse(input)

  if (!request.success) {
    return left({ kind: "invalid-request", operation: "register" })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) return left({ kind: "transport", operation: "register" })

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "register",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, authSchema))

    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "register" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "register" })
  }
}

/** Read the backend-owned account record for the presented access token. */
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

/** Ask the backend to revoke this refresh token before clearing the web session. */
export function* signOut(refreshToken: string): Operation<Outcome<void>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal,
      })
    )

    if (!response.ok) return left({ kind: "transport", operation: "logout" })

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "logout",
        status: response.value.status,
      })
    }

    return right(undefined)
  } catch {
    return left({ kind: "transport", operation: "logout" })
  }
}
