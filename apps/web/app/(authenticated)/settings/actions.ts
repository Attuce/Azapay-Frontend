"use server"

import { run } from "effection"
import { revalidatePath } from "next/cache"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import {
  updateProfile,
  updateSettings,
} from "@/src/features/settings/operations"
import {
  profileUpdateSchema,
  settingsUpdateSchema,
} from "@/src/features/settings/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { readUsableSession } from "@/src/server/session"

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
