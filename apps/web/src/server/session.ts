import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { until, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Outcome } from "../application/errors"
import { refreshTokens } from "../features/auth/operations"
import { tokenPairSchema, type TokenPair } from "../features/auth/schemas"
import { ServerConfigContext } from "./config"

const COOKIE_NAME = "azapay_session"

/** The authentication state a Server Component can safely act on. */
export type PageSession =
  | { readonly kind: "missing" }
  | { readonly kind: "expired"; readonly session: TokenPair }
  | { readonly kind: "authenticated"; readonly session: TokenPair }

/** Encrypt a backend token pair with the key in the current Effection scope. */
export function* sealSession(tokens: TokenPair): Operation<string | null> {
  const { sessionKey } = yield* ServerConfigContext.expect()
  const parsed = tokenPairSchema.safeParse(tokens)

  if (!parsed.success) return null

  try {
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", sessionKey, iv)

    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(parsed.data), "utf8"),
      cipher.final(),
    ])

    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      "base64url"
    )
  } catch {
    return null
  }
}

/** Authenticate and decode a cookie; reject malformed or expired sessions. */
export function* unsealSession(
  value: string | undefined
): Operation<TokenPair | null> {
  const { sessionKey } = yield* ServerConfigContext.expect()
  if (!value) return null

  try {
    const bytes = Buffer.from(value, "base64url")

    // Reject noncanonical encodings that decode to the same encrypted bytes.
    if (bytes.toString("base64url") !== value) return null
    if (bytes.length < 29) return null

    const decipher = createDecipheriv(
      "aes-256-gcm",
      sessionKey,
      bytes.subarray(0, 12)
    )

    decipher.setAuthTag(bytes.subarray(12, 28))

    const plaintext = Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ])

    const parsed = tokenPairSchema.safeParse(
      JSON.parse(plaintext.toString("utf8"))
    )

    if (
      !parsed.success ||
      Date.parse(parsed.data.refresh_expires_at) <= Date.now()
    ) {
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

/** Read the current request's encrypted session cookie. */
export function* readSession(): Operation<TokenPair | null> {
  const cookieStore = yield* until(cookies())
  return yield* unsealSession(cookieStore.get(COOKIE_NAME)?.value)
}

/** Check whether the access token is still usable without refreshing it. */
export function hasValidAccessToken(session: TokenPair | null): boolean {
  return session !== null && Date.parse(session.expires_at) > Date.now()
}

/**
 * Classify the current cookie for a page without mutating it.
 *
 * Server Components cannot write cookies, so callers redirect expired sessions
 * through the refresh route instead of attempting token rotation while rendering.
 */
export function* readPageSession(): Operation<PageSession> {
  const session = yield* readSession()
  if (!session) return { kind: "missing" }

  if (!hasValidAccessToken(session)) return { kind: "expired", session }

  return { kind: "authenticated", session }
}

/**
 * Require a usable access token before a protected page performs its API read.
 *
 * The operation runs inside the page's existing Effection scope. Redirects are
 * Next.js page-boundary control flow, not application-error outcomes.
 */
export function* requirePageSession(returnTo: string): Operation<TokenPair> {
  const session = yield* readPageSession()

  if (session.kind === "missing") redirect("/login")

  if (session.kind === "expired") {
    redirect(`/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return session.session
}

/** Read a session and rotate its token pair when the access token has expired. */
export function* readUsableSession(): Operation<Outcome<TokenPair | null>> {
  const pageSession = yield* readPageSession()
  if (pageSession.kind === "missing") return right(null)

  if (pageSession.kind === "authenticated") return right(pageSession.session)

  const refreshed = yield* refreshTokens({
    refresh_token: pageSession.session.refresh_token,
  })

  if (refreshed._tag === "Left") return left(refreshed.left)

  const written = yield* writeSession(refreshed.right)
  if (!written) return left({ kind: "invalid-response", operation: "refresh" })

  return right(refreshed.right)
}

/** Write an HttpOnly cookie bounded by the backend refresh-token expiry. */
export function* writeSession(tokens: TokenPair): Operation<boolean> {
  const value = yield* sealSession(tokens)
  if (!value) return false

  const maxAge = Math.floor(
    (Date.parse(tokens.refresh_expires_at) - Date.now()) / 1000
  )

  if (maxAge <= 0) return false

  const cookieStore = yield* until(cookies())
  const { secureCookies } = yield* ServerConfigContext.expect()

  cookieStore.set(COOKIE_NAME, value, {
    secure: secureCookies,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    maxAge,
  })

  return true
}

/** Remove the browser-facing session even if backend revocation failed. */
export function* clearSession(): Operation<void> {
  const cookieStore = yield* until(cookies())
  cookieStore.delete(COOKIE_NAME)
}
