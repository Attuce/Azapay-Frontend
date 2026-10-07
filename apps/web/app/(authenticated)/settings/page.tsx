import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import Link from "next/link"
import { connection } from "next/server"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import type { User } from "@/src/features/auth/schemas"
import { getProfile, getSettings } from "@/src/features/settings/operations"
import type { Settings } from "@/src/features/settings/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { PreferencesForm, ProfileForm } from "@/components/settings-forms"

type SettingsPageData = { readonly profile: User; readonly settings: Settings }

/** Read both settings resources without treating one failed read as success. */
function* loadSettingsPage(): Operation<Outcome<SettingsPageData>> {
  const profile = yield* getProfile()
  if (profile._tag === "Left") return left(profile.left)

  const settings = yield* getSettings()
  if (settings._tag === "Left") return left(settings.left)

  return right({ profile: profile.right, settings: settings.right })
}

/** Render profile and preferences from backend-owned account state. */
export default async function SettingsPage() {
  // The cookie read inside Effection is not visible to Next's static analysis.
  await connection()
  const config = loadServerConfig()

  if (!config) {
    return <main className="p-12">Settings are temporarily unavailable.</main>
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/settings")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadSettingsPage()
  })

  if (outcome._tag === "Left") {
    return (
      <main className="p-12">
        We couldn’t load your settings. Try again later.
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#f3f5f1] px-6 py-10 text-[#172d31]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#a54d2f] hover:underline"
        >
          ← Account
        </Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-[#506665]">
          Manage your profile and communication preferences.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ProfileForm profile={outcome.right.profile} />
          <PreferencesForm settings={outcome.right.settings} />
        </div>
      </div>
    </main>
  )
}
