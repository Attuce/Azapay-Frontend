"use client"

import { useActionState } from "react"
import {
  acceptConsentAction,
  deactivateAccountAction,
  updatePreferencesAction,
  updateProfileAction,
} from "@/app/(authenticated)/settings/actions"
import type { User } from "@/src/features/auth/schemas"
import type { Consent, Settings } from "@/src/features/settings/schemas"

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"

function Status({
  state,
}: {
  state: { message: string; success?: boolean } | null
}) {
  if (!state) return null

  return (
    <p
      role={state.success ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm ${state.success ? "bg-[#e6f2ed] text-[#245b49]" : "bg-[#fff1eb] text-[#8c3c24]"}`}
    >
      {state.message}
    </p>
  )
}

/** Editable profile fields backed by the profile server action. */
export function ProfileForm({ profile }: { profile: User }) {
  const [state, action, pending] = useActionState(updateProfileAction, null)

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-[#cbd6d3] bg-white p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-[#506665]">
          Update how your account identifies you.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Full name
        <input
          className={inputClass}
          name="full_name"
          defaultValue={profile.full_name}
          required
          maxLength={200}
          autoComplete="name"
        />
      </label>
      <label className="block text-sm font-medium">
        Username
        <input
          className={inputClass}
          name="username"
          defaultValue={profile.username ?? ""}
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]+"
          autoComplete="username"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone number
        <input
          className={inputClass}
          name="phone_number"
          defaultValue={profile.phone_number ?? ""}
          pattern="\+?[0-9]{7,15}"
          autoComplete="tel"
        />
      </label>
      <Status state={state} />
      <button
        disabled={pending}
        className="rounded-full bg-[#193a3d] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  )
}

/** Notification and timezone preferences backed by the settings server action. */
export function PreferencesForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(updatePreferencesAction, null)
  const choices = [
    [
      "email_transactional",
      "Transactional email",
      settings.email_transactional,
    ],
    [
      "email_marketing",
      "Product and marketing email",
      settings.email_marketing,
    ],
    ["push_enabled", "Push notifications", settings.push_enabled],
    ["weekly_digest", "Weekly digest", settings.weekly_digest],
  ] as const

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-[#cbd6d3] bg-white p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Preferences</h2>
        <p className="mt-1 text-sm text-[#506665]">
          Choose when and how AzaPay contacts you.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Timezone
        <input
          className={inputClass}
          name="timezone"
          defaultValue={settings.timezone}
          required
          maxLength={64}
          aria-describedby="timezone-help"
        />
        <span id="timezone-help" className="mt-2 block text-xs font-normal text-[#506665]">
          Use an IANA timezone such as Africa/Lagos or Europe/London.
        </span>
      </label>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium">Notifications</legend>
        {choices.map(([name, label, checked]) => (
          <label key={name} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name={name}
              defaultChecked={checked}
              className="size-4 accent-[#193a3d]"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Status state={state} />
      <button
        disabled={pending}
        className="rounded-full bg-[#193a3d] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  )
}

function ConsentGrantForm({
  scope,
  version,
  accepted,
}: {
  readonly scope: string
  readonly version: string
  readonly accepted: boolean
}) {
  const [state, action, pending] = useActionState(acceptConsentAction, null)

  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e1e8e5] py-4"
    >
      <div>
        <p className="font-medium">
          <code>{scope}</code>
        </p>
        <p className="mt-1 text-sm text-[#506665]">Current version: {version}</p>
        <a
          href={`https://example.com/policies/${encodeURIComponent(scope)}/${encodeURIComponent(version)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-medium text-[#a54d2f] underline underline-offset-4"
        >
          Read the {scope} policy (placeholder link)
        </a>
        {accepted && (
          <p className="mt-1 text-sm text-emerald-800">
            Accepted current version
          </p>
        )}
      </div>
      {!accepted && (
        <>
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="version" value={version} />
          <button
            disabled={pending}
            className="rounded-full bg-[#193a3d] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Accept current version"}
          </button>
        </>
      )}
      <div className="w-full">
        <Status state={state} />
      </div>
    </form>
  )
}

/** Show the API's current consent versions and record acceptance only for those exact versions. */
export function ConsentManager({ consent }: { readonly consent: Consent }) {
  const requirements = Object.entries(consent.required_consents)

  return (
    <section className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
      <h2 className="text-xl font-semibold">Consent</h2>
      <p className="mt-1 text-sm text-[#506665]">
        Review the current scope and version identifiers published by AzaPay.
        Policy links below use placeholder URLs and must be replaced with
        approved policy pages before launch.
      </p>
      {requirements.length ? (
        <div className="mt-4">
          {requirements.map(([scope, version]) => {
            const grant = consent.my_consents[scope]
            const accepted =
              grant?.version === version && grant.accepted_at != null

            return (
              <ConsentGrantForm
                key={scope}
                scope={scope}
                version={version}
                accepted={accepted}
              />
            )
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#506665]">
          There are no required consent updates.
        </p>
      )}
    </section>
  )
}

/** Require a deliberate typed confirmation before asking the API to deactivate the account. */
export function AccountClosureForm() {
  const [state, action, pending] = useActionState(deactivateAccountAction, null)
  return (
    <form action={action} className="rounded-2xl border border-[#d6a392] bg-white p-6">
      <h2 className="text-xl font-semibold">Close account</h2>
      <p className="mt-2 text-sm text-[#506665]">This deactivates your account and asks AzaPay to revoke every active session. You will be signed out.</p>
      <label className="mt-4 block text-sm font-medium">
        Type <code>DEACTIVATE</code> to confirm
        <input className={inputClass} name="confirmation" autoComplete="off" required pattern="DEACTIVATE" />
      </label>
      <Status state={state} />
      <button disabled={pending} className="mt-4 rounded-full bg-[#8c3c24] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
        {pending ? "Closing account…" : "Deactivate account"}
      </button>
    </form>
  )
}
