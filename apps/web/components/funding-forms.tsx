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

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"

function Status({ state }: { state: FundingFormState }) {
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
    <div className="rounded-xl border border-[#dfe7e4] bg-[#f7faf8] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{connection.bank_name ?? "Bank account"}</p>
          <p className="mt-1 text-sm text-[#506665]">
            {connection.account_name ?? "Customer account"} ·••• {connection.account_number_last4 ?? "0000"}
          </p>
        </div>
        <span className="rounded-full bg-[#eff4f2] px-3 py-1 text-xs font-semibold capitalize text-[#162c3a]">
          {connection.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#506665]">
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
              <button disabled={defaultPending} className="rounded-full border border-[#193a3d] px-4 py-2 text-sm font-semibold text-[#193a3d] disabled:opacity-60">
                {defaultPending ? "Updating…" : "Make default"}
              </button>
              <Status state={defaultState} />
            </form>
          ) : null}
          <form action={revokeAction}>
            <input type="hidden" name="funding_connection_id" value={connection.id} />
            <button disabled={revokePending} className="rounded-full border border-[#c77a64] px-4 py-2 text-sm font-semibold text-[#8c3c24] disabled:opacity-60">
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
}: {
  banks: Bank[]
  connections: FundingConnection[]
}) {
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
          className="space-y-5 rounded-2xl border border-[#cbd6d3] bg-white p-6"
        >
          <div>
            <h2 className="text-xl font-semibold">Link a bank account</h2>
            <p className="mt-1 text-sm text-[#506665]">
              Start the provider verification charge and finish with the OTP.
            </p>
          </div>

          {banks.length === 0 ? (
            <p className="rounded-xl bg-[#fff1eb] px-4 py-3 text-sm text-[#8c3c24]">
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
            className="rounded-full bg-[#193a3d] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {startPending ? "Verifying…" : "Start verification"}
          </button>
        </form>

        {startState?.bankLinkId ? (
          <form
            action={otpAction}
            className="space-y-5 rounded-2xl border border-[#cbd6d3] bg-white p-6"
          >
            <div>
              <h2 className="text-xl font-semibold">Confirm OTP</h2>
              <p className="mt-1 text-sm text-[#506665]">
                Enter the OTP sent by your bank to finish verification.
              </p>
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
              className="rounded-full bg-[#193a3d] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {otpPending ? "Confirming…" : "Verify OTP"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
            <h2 className="text-xl font-semibold">Confirm OTP</h2>
            <p className="mt-2 text-sm text-[#506665]">
              Start bank verification first. We’ll show the OTP form when your
              bank-link request is ready.
            </p>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Connected funding sources</h2>
          <span className="rounded-full bg-[#eff4f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3b4d4c]">
            {connections.length} total
          </span>
        </div>

        {connections.length === 0 ? (
          <p className="mt-4 text-sm text-[#506665]">
            No funding sources connected yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {connections.map((connection) => (
              <FundingConnectionCard key={connection.id} connection={connection} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
