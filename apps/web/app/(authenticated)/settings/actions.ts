"use server"

import { run } from "effection"
import { revalidatePath } from "next/cache"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import {
  updateProfile,
  updateSettings,
  getConsents,
  recordConsent,
  deactivateAccount,
} from "@/src/features/settings/operations"
import {
  profileUpdateSchema,
  settingsUpdateSchema,
  consentInputSchema,
} from "@/src/features/settings/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { clearSession, readUsableSession } from "@/src/server/session"
import { redirect } from "next/navigation"

export type SettingsFormState = { message: string; success?: boolean } | null

/** Validate and save editable customer profile fields. */
export async function updateProfileAction(
  _state: SettingsFormState,
  form: FormData
): Promise<SettingsFormState> {
  const input = profileUpdateSchema.safeParse({
    full_name: form.get("full_name"),
    username: form.get("username") || null,
    phone_number: form.get("phone_number") || null,
  })

  if (!input.success) {
    return { message: "Check your name, username, and phone number." }
  }

  const config = loadServerConfig()
  if (!config) throw new Error("AzaPay server configuration is unavailable")

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* readUsableSession()
    if (session._tag === "Left" || session.right === null) {
      throw new Error("An authenticated session is required")
    }

    yield* AccessTokenContext.set(session.right.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* updateProfile(input.data)
  })

  if (outcome._tag === "Left") {
    return { message: "We couldn't update your profile." }
  }

  revalidatePath("/settings")
  return { message: "Profile updated.", success: true }
}

/** Save the complete preferences form as one contract-validated update. */
export async function updatePreferencesAction(
  _state: SettingsFormState,
  form: FormData
): Promise<SettingsFormState> {
  const input = settingsUpdateSchema.safeParse({
    timezone: form.get("timezone"),
    email_transactional: form.get("email_transactional") === "on",
    email_marketing: form.get("email_marketing") === "on",
    push_enabled: form.get("push_enabled") === "on",
    weekly_digest: form.get("weekly_digest") === "on",
  })

  if (!input.success) return { message: "Check your preference values." }

  const config = loadServerConfig()
  if (!config) throw new Error("AzaPay server configuration is unavailable")

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* readUsableSession()

    if (session._tag === "Left" || session.right === null) {
      throw new Error("An authenticated session is required")
    }

    yield* AccessTokenContext.set(session.right.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* updateSettings(input.data)
  })

  if (outcome._tag === "Left") {
    return { message: "We couldn't update your preferences." }
  }

  revalidatePath("/settings")
  return { message: "Preferences updated.", success: true }
}

/** Accept only the exact current consent version returned by the backend. */
export async function acceptConsentAction(
  _state: SettingsFormState,
  form: FormData
): Promise<SettingsFormState> {
  const input = consentInputSchema.safeParse({ scope: form.get("scope"), version: form.get("version") })
  if (!input.success) return { message: "This consent version is invalid." }

  const config = loadServerConfig()
  if (!config) throw new Error("AzaPay server configuration is unavailable")
  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* readUsableSession()
    if (session._tag === "Left" || session.right === null) throw new Error("An authenticated session is required")
    yield* AccessTokenContext.set(session.right.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    const current = yield* getConsents()
    if (current._tag === "Left") return { kind: "error" as const }
    if (current.right.required_consents[input.data.scope] !== input.data.version) return { kind: "stale" as const }
    const grant = current.right.my_consents[input.data.scope]
    if (grant?.version === input.data.version && grant.accepted_at) return { kind: "already-accepted" as const }
    const recorded = yield* recordConsent(input.data)
    return recorded._tag === "Right" ? { kind: "accepted" as const } : { kind: "error" as const }
  })

  if (outcome.kind === "stale") return { message: "The consent version changed. Refresh and review the current version." }
  if (outcome.kind === "error") return { message: "We couldn’t save this consent. Try again." }
  revalidatePath("/settings")
  return { message: outcome.kind === "already-accepted" ? "This consent is already current." : "Consent recorded.", success: true }
}

/** Deactivate the account once the customer explicitly confirms the irreversible request. */
export async function deactivateAccountAction(
  _state: SettingsFormState,
  form: FormData
): Promise<SettingsFormState> {
  if (form.get("confirmation") !== "DEACTIVATE") {
    return { message: "Type DEACTIVATE to confirm account closure." }
  }
  const config = loadServerConfig()
  if (!config) throw new Error("AzaPay server configuration is unavailable")
  const result = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* readUsableSession()
    if (session._tag === "Left" || session.right === null) throw new Error("An authenticated session is required")
    yield* AccessTokenContext.set(session.right.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    const deactivated = yield* deactivateAccount()
    if (deactivated._tag === "Left") return false
    yield* clearSession()
    return true
  })
  if (!result) return { message: "We couldn’t deactivate your account. Try again later." }
  redirect("/login?status=deactivated")
}
