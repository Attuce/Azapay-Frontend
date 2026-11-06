"use client"

import { useActionState } from "react"
import {
  completeBankLinkAction,
  revokeFundingConnectionAction,
  setDefaultFundingConnectionAction,
  startBankLinkAction,
  type FundingFormState,
} from "@/app/(authenticated)/funding/actions"
import type { Bank, FundingConnection } from "@/src/features/funding/schemas"

const inputClass = "field mt-2"

function Status({ state }: { state: FundingFormState }) {
  if (!state) return null

  return (
    <p
      role={state.success ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm ${state.success ? "bg-[var(--ok-tint)] text-[var(--ok)]" : "bg-[var(--er-tint)] text-[var(--er)]"}`}
    >
      {state.message}
    </p>
  )
}

function FundingConnectionCard({ connection }: { connection: FundingConnection }) {
  const [defaultState, defaultAction, defaultPending] = useActionState(
    setDefaultFundingConnectionAction,
    null
  )
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeFundingConnectionAction,
    null
  )

  return (
    <div className="rounded-xl border border-[var(--ln)] bg-[var(--fd)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{connection.bank_name ?? "Bank account"}</p>
          <p className="mt-1 text-sm text-[var(--mu)]">
            {connection.account_name ?? "Customer account"}
            {connection.account_number_last4
              ? ` ·••• ${connection.account_number_last4}`
              : ""}
          </p>
        </div>
        <span className="rounded-full bg-[var(--fd)] px-3 py-1 text-xs font-semibold capitalize text-[var(--ink)]">
          {connection.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--mu)]">
        <span>{connection.kind}</span>
        <span>•</span>
        <span>{connection.currency}</span>
        {connection.is_default ? <span>• Default source</span> : null}
      </div>

      {connection.status !== "revoked" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {!connection.is_default && connection.status === "active" ? (
            <form action={defaultAction}>
              <input type="hidden" name="funding_connection_id" value={connection.id} />
              <button disabled={defaultPending} className="rounded-full border border-[var(--tx)] px-4 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-60">
                {defaultPending ? "Updating…" : "Make default"}
              </button>
              <Status state={defaultState} />
            </form>
          ) : null}
          <form action={revokeAction}>
            <input type="hidden" name="funding_connection_id" value={connection.id} />
            <button disabled={revokePending} className="rounded-full border border-[var(--er)] px-4 py-2 text-sm font-semibold text-[var(--er)] disabled:opacity-60">
              {revokePending ? "Removing…" : "Remove source"}
            </button>
            <Status state={revokeState} />
          </form>
        </div>
      ) : null}
    </div>
  )
}

/** Client-side flow for starting a bank link and confirming the OTP challenge. */
export function FundingJourney({
  banks,
  connections,
  query = "",
}: {
  banks: Bank[]
  connections: FundingConnection[]
  query?: string
}) {
  const needle = query.trim().toLowerCase()
  const matches = (...values: (string | null | undefined)[]) =>
    !needle || values.some((value) => value?.toLowerCase().includes(needle))
  const visibleConnections = connections.filter((connection) =>
    matches(connection.bank_name, connection.account_name, connection.status, connection.account_number_last4)
  )
  const [startState, startAction, startPending] = useActionState(
    startBankLinkAction,
    null
  )
  const [otpState, otpAction, otpPending] = useActionState(
    completeBankLinkAction,
    null
  )

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <form
          action={startAction}
          className="space-y-5 rounded-2xl border border-[var(--ln)] bg-[var(--cd)] p-6"
        >
          <div>
            <h2 className="text-xl font-semibold">Link a bank account</h2>
            <p className="mt-1 text-sm text-[var(--mu)]">
              Start the provider verification charge and finish with the OTP.
            </p>
          </div>

          {banks.length === 0 ? (
            <p className="rounded-xl bg-[var(--er-tint)] px-4 py-3 text-sm text-[var(--er)]">
              No banks are available right now. Please try again later.
            </p>
          ) : null}

          <label className="block text-sm font-medium">
            Bank
            <select
              className={inputClass}
              name="bank_code"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select your bank
              </option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Account number
            <input
              className={inputClass}
              name="account_number"
              inputMode="numeric"
              pattern="[0-9]{10}"
              placeholder="0123456789"
              required
              maxLength={10}
            />
          </label>

          <Status state={startState} />

          <button
            disabled={startPending || banks.length === 0}
            className="rounded-full bg-[var(--bl)] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {startPending ? "Verifying…" : "Start verification"}
          </button>
        </form>

        {startState?.bankLinkId &&
        startState.bankLinkStatus === "otp_required" ? (
          <form
            action={otpAction}
            className="space-y-5 rounded-2xl border border-[var(--ln)] bg-[var(--cd)] p-6"
          >
            <div>
              <h2 className="text-xl font-semibold">Confirm OTP</h2>
              <p className="mt-1 text-sm text-[var(--mu)]">
                Enter the OTP sent by your bank to finish verification.
              </p>
              {(startState.resolvedAccountName ||
                startState.accountNumberLast4) && (
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                  {startState.resolvedAccountName
                    ? `${startState.resolvedAccountName} · `
                    : ""}
                  Account ending in {startState.accountNumberLast4}
                </p>
              )}
            </div>

            <input
              type="hidden"
              name="bank_link_id"
              value={startState.bankLinkId}
            />

            <label className="block text-sm font-medium">
              OTP
              <input
                className={inputClass}
                name="otp"
                inputMode="numeric"
                placeholder="123456"
                required
                minLength={4}
                maxLength={10}
              />
            </label>

            <Status state={otpState} />

            <button
              disabled={otpPending}
              className="rounded-full bg-[var(--bl)] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {otpPending ? "Confirming…" : "Verify OTP"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-[var(--ln)] bg-[var(--cd)] p-6">
            <h2 className="text-xl font-semibold">Confirm OTP</h2>
            <p className="mt-2 text-sm text-[var(--mu)]">
              Start bank verification first. We’ll show the OTP form when your
              bank-link request is ready.
            </p>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--ln)] bg-[var(--cd)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Connected funding sources</h2>
          <span className="rounded-full bg-[var(--fd)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
            {needle ? `${visibleConnections.length} of ${connections.length}` : `${connections.length} total`}
          </span>
        </div>

        {visibleConnections.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--mu)]">
            {needle ? <>Nothing matches “{needle}”.</> : "No funding sources connected yet."}
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {visibleConnections.map((connection) => (
              <FundingConnectionCard key={connection.id} connection={connection} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
