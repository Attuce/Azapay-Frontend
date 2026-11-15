import { auth, clerkClient } from "@clerk/nextjs/server"
import { until, type Operation } from "effection"
import { right } from "fp-ts/Either"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Outcome } from "../application/errors"
import { ServerConfigContext } from "./config"

const E2E_COOKIE = "azapay_e2e_session"
const E2E_ACCESS_TOKEN = "test-access-token"

/** A short-lived bearer token for one authenticated API request. */
export interface PageSession {
  readonly access_token: string
}

/** Resolve a Clerk session token inside this request's Effection scope.
 *
 * Clerk owns the browser cookie, session expiry, renewal, and revocation. The
 * returned JWT is kept inside the server request and passed only to AzaPay.
 */
export function* readPageSession(): Operation<PageSession | null> {
  const config = yield* ServerConfigContext.expect()

  if (config.e2eTestMode) {
    const cookieStore = yield* until(cookies())
    if (cookieStore.get(E2E_COOKIE)?.value === "enabled") {
      return { access_token: E2E_ACCESS_TOKEN }
    }
  }

  if (!config.clerkPublishableKey || !config.clerkSecretKey) return null

  try {
    const session = yield* until(auth())
    if (!session.userId) return null

    const accessToken = yield* until(session.getToken())
    return accessToken ? { access_token: accessToken } : null
  } catch {
    return null
  }
}

/** Require Clerk authentication before a protected read or mutation. */
export function* requirePageSession(returnTo: string): Operation<PageSession> {
  const session = yield* readPageSession()
  if (!session) redirect(`/login?redirect_url=${encodeURIComponent(returnTo)}`)
  return session
}

/** Resolve an optional session for actions that return typed auth failures. */
export function* readUsableSession(): Operation<Outcome<PageSession | null>> {
  return right(yield* readPageSession())
}

/** Revoke other active Clerk sessions before the browser signs out locally. */
export function* revokeAllUserSessions(): Operation<boolean> {
  const config = yield* ServerConfigContext.expect()
  if (config.e2eTestMode) return true
  if (!config.clerkPublishableKey || !config.clerkSecretKey) return false

  try {
    const current = yield* until(auth())
    if (!current.userId) return false

    const client = yield* until(clerkClient())
    const activeSessionIds: string[] = []
    let offset = 0
    let totalCount = 0
    do {
      const page = yield* until(
        client.sessions.getSessionList({
          userId: current.userId,
          status: "active",
          limit: 500,
          offset,
        })
      )
      activeSessionIds.push(
        ...page.data
          .filter((session) => session.id !== current.sessionId)
          .map((session) => session.id)
      )
      totalCount = page.totalCount
      offset += page.data.length
      if (page.data.length === 0) break
    } while (offset < totalCount)

    yield* until(
      Promise.all(activeSessionIds.map((id) => client.sessions.revokeSession(id)))
    )
    return true
  } catch {
    return false
  }
}
