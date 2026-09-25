"use client"

import { useActionState } from "react"
import {
  updatePreferencesAction,
  updateProfileAction,
} from "@/app/(authenticated)/settings/actions"
import type { User } from "@/src/features/auth/schemas"
import type { Settings } from "@/src/features/settings/schemas"

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
      role="status"
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
        />
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
