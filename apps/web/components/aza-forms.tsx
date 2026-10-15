"use client"

import { useActionState } from "react"
import type { Aza, AzaMember, AzaPosition } from "@/src/features/aza/schemas"
import type { Contribution, Invite, WithdrawalView } from "@/src/features/aza/schemas"
import type { FundingConnection } from "@/src/features/funding/schemas"
import {
  acceptAzaInviteAction, cancelAzaWithdrawalAction, createAzaAction,
  closeAzaAction, confirmAzaWithdrawalAction, createAzaContributionAction, createAzaInviteAction,
  releaseMaturedAzaAction, requestAzaWithdrawalAction, revokeAzaInviteAction, updateAzaAction, type AzaFormState,
} from "@/app/(authenticated)/azas/actions"
import type { Bank } from "@/src/features/funding/schemas"

const empty: AzaFormState = null
const inputClass = "mt-1 w-full rounded-lg border border-[#b9c9c4] bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#172d31]"
const buttonClass = "rounded-full bg-[#172d31] px-5 py-2 text-sm font-semibold text-white hover:bg-[#29484a] disabled:opacity-60"

function Feedback({ state }: { readonly state: AzaFormState }) {
  return state ? <p className={state.success ? "mt-3 text-sm text-emerald-800" : "mt-3 text-sm text-red-800"} role={state.success ? "status" : "alert"}>{state.message}</p> : null
}

/** Create Azas and accept invitations by token. */
export function AzaCollectionForms() {
  const [createState, createAction, creating] = useActionState(createAzaAction, empty)
  const [acceptState, acceptAction, accepting] = useActionState(acceptAzaInviteAction, empty)
  return <div className="grid gap-6 lg:grid-cols-2">
    <form action={createAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
      <h2 className="text-xl font-semibold">Create an Aza</h2>
      <label className="mt-4 block text-sm font-medium">Name<input className={inputClass} name="name" required maxLength={120} /></label>
      <label className="mt-3 block text-sm font-medium">Description<input className={inputClass} name="description" maxLength={500} /></label>
      <label className="mt-3 block text-sm font-medium">Purpose<input className={inputClass} name="purpose" maxLength={500} /></label>
      <label className="mt-3 block text-sm font-medium">Visibility<select className={inputClass} name="visibility" defaultValue="unlisted"><option value="unlisted">Unlisted</option><option value="private">Private (invitation only)</option><option value="public">Public</option></select></label>
      <label className="mt-3 block text-sm font-medium">Saving mode<select className={inputClass} name="mode" defaultValue="flexible"><option value="flexible">Flexible</option><option value="fixed">Fixed</option></select></label>
      <label className="mt-3 block text-sm font-medium">Target amount (optional)<input className={inputClass} name="target_amount" inputMode="decimal" placeholder="10000.00" /></label>
      <label className="mt-3 block text-sm font-medium">Goal deadline (optional)<input className={inputClass} name="deadline" type="date" /></label>
      <label className="mt-3 block text-sm font-medium">Maturity date (optional)<input className={inputClass} name="maturity_date" type="date" /></label>
      <button className={`${buttonClass} mt-5`} disabled={creating}>Create Aza</button><Feedback state={createState} />
    </form>
    <form action={acceptAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
      <h2 className="text-xl font-semibold">Accept an invitation</h2>
      <p className="mt-2 text-sm text-[#506665]">Paste the invitation token you received.</p>
      <label className="mt-4 block text-sm font-medium">Invitation token<input className={inputClass} name="invite_token" required /></label>
      <button className={`${buttonClass} mt-5`} disabled={accepting}>Accept invitation</button><Feedback state={acceptState} />
    </form>
  </div>
}

/** Present Aza metadata and supported member, contribution, and withdrawal actions. */
export function AzaDetailJourney(props: {
  readonly aza: Aza
  readonly fundingSources: FundingConnection[]
  readonly banks: Bank[]
  readonly members: AzaMember[]
  readonly position: AzaPosition
  readonly contributions: Contribution[]
  readonly invites: Invite[]
  readonly withdrawals: WithdrawalView[]
  readonly isOwner: boolean
  readonly requestKey: string
  readonly releaseKey: string
}) {
  const { aza, fundingSources, banks, members, position, contributions, invites, withdrawals, isOwner, requestKey, releaseKey } = props
  const [updateState, updateAction, updating] = useActionState(updateAzaAction, empty)
  const [inviteState, inviteAction, inviting] = useActionState(createAzaInviteAction, empty)
  const [revokeState, revokeAction, revoking] = useActionState(revokeAzaInviteAction, empty)
  const [contributionState, contributionAction, contributing] = useActionState(createAzaContributionAction, empty)
  const [withdrawalState, withdrawalAction, withdrawing] = useActionState(requestAzaWithdrawalAction, empty)
  const [cancelState, cancelAction, cancelling] = useActionState(cancelAzaWithdrawalAction, empty)
  const [confirmState, confirmAction, confirming] = useActionState(confirmAzaWithdrawalAction, empty)
  const [closeState, closeAction, closing] = useActionState(closeAzaAction, empty)
  const [releaseState, releaseAction, releasing] = useActionState(releaseMaturedAzaAction, empty)
  const activeSources = fundingSources.filter((source) => source.status === "active")
  const canInvite = isOwner && aza.visibility === "private"
  return <div className="mt-8 grid gap-6">
    <section className="grid gap-4 rounded-2xl border border-[#cbd6d3] bg-white p-6 sm:grid-cols-3">
      <div><p className="text-sm text-[#506665]">Status</p><p className="mt-1 font-semibold capitalize">{aza.status}</p></div>
      <div><p className="text-sm text-[#506665]">Backend balance</p><p className="mt-1 font-mono font-semibold">{aza.display_balance === null ? "Not provided" : `₦${aza.display_balance}`}</p></div>
      <div><p className="text-sm text-[#506665]">Confirmed position</p><p className="mt-1 font-mono font-semibold">₦{position.confirmed_position}</p></div>
      {aza.target_amount && <div><p className="text-sm text-[#506665]">Target</p><p className="mt-1 font-mono">₦{aza.target_amount}</p></div>}
      {aza.maturity_date && <div><p className="text-sm text-[#506665]">Maturity date</p><p className="mt-1">{aza.maturity_date}</p></div>}
      <div><p className="text-sm text-[#506665]">Mode</p><p className="mt-1 capitalize">{aza.mode}</p></div>
    </section>
    {isOwner && <form action={updateAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-xl font-semibold">Aza details</h2><input type="hidden" name="aza_id" value={aza.id} /><label className="mt-3 block text-sm font-medium">Name<input className={inputClass} name="name" defaultValue={aza.name} required /></label><label className="mt-3 block text-sm font-medium">Description<input className={inputClass} name="description" defaultValue={aza.description ?? ""} /></label><button className={`${buttonClass} mt-4`} disabled={updating}>Save details</button><Feedback state={updateState} /></form>}
    {isOwner && aza.status !== "closed" && <form action={closeAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-lg font-semibold">Close Aza</h2><p className="mt-2 text-sm text-[#506665]">The backend checks that the position is zero and there are no active references.</p><input type="hidden" name="aza_id" value={aza.id} /><label className="mt-3 block text-sm font-medium">Reason (optional)<input className={inputClass} name="reason" maxLength={500} /></label><button className="mt-4 rounded-full border border-[#a54d2f] px-5 py-2 text-sm font-semibold text-[#a54d2f]" disabled={closing}>Request closure</button><Feedback state={closeState} /></form>}
    {isOwner && aza.status === "matured" && <form action={releaseAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-lg font-semibold">Release matured Aza</h2><p className="mt-2 text-sm text-[#506665]">The backend owns eligibility and releases the full provider position.</p><input type="hidden" name="aza_id" value={aza.id} /><input type="hidden" name="idempotency_key" value={releaseKey} /><button className={`${buttonClass} mt-4`} disabled={releasing}>Request release</button><Feedback state={releaseState} /></form>}
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-xl font-semibold">Members</h2>{members.length ? <ul className="mt-4 divide-y divide-[#e0e8e5]">{members.map((member) => <li key={member.user_id} className="flex justify-between gap-3 py-3 text-sm"><span>{member.full_name}<span className="ml-2 text-[#506665]">{member.email}</span></span><span className="capitalize text-[#506665]">{member.role}</span></li>)}</ul> : <p className="mt-3 text-sm text-[#506665]">No members listed.</p>}</div>
      <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-xl font-semibold">Contributions</h2>{contributions.length ? <ul className="mt-4 divide-y divide-[#e0e8e5]">{contributions.map((item) => <li key={item.id} className="flex justify-between py-3 text-sm"><span className="capitalize">{item.status}</span><span className="font-mono">₦{item.amount}</span></li>)}</ul> : <p className="mt-3 text-sm text-[#506665]">No contributions yet.</p>}
        <form action={contributionAction} className="mt-5 border-t border-[#e0e8e5] pt-4"><input type="hidden" name="aza_id" value={aza.id} /><label className="block text-sm font-medium">Funding source<select className={inputClass} name="funding_connection_id" required defaultValue=""><option value="" disabled>Select an active source</option>{activeSources.map((source) => <option key={source.id} value={source.id}>{source.bank_name ?? source.kind} •••• {source.account_number_last4 ?? "—"}</option>)}</select></label><label className="mt-3 block text-sm font-medium">Amount<input className={inputClass} name="amount" inputMode="decimal" placeholder="1000.00" required /></label><button className={`${buttonClass} mt-4`} disabled={contributing || activeSources.length === 0}>Start contribution</button><Feedback state={contributionState} /><p className="mt-2 text-xs text-[#506665]">Starting a contribution instruction does not mean payment has settled.</p></form>
      </div>
      <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-xl font-semibold">Invitations</h2>{invites.length ? <ul className="mt-4 divide-y divide-[#e0e8e5]">{invites.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{item.email} <span className="text-[#506665]">· {item.status}</span></span>{item.status === "pending" && canInvite && <form action={revokeAction}><input type="hidden" name="aza_id" value={aza.id} /><input type="hidden" name="invite_id" value={item.id} /><button className="font-semibold text-[#a54d2f] underline" disabled={revoking}>Revoke</button></form>}</li>)}</ul> : <p className="mt-3 text-sm text-[#506665]">No invitations.</p>}{canInvite && <form action={inviteAction} className="mt-5 border-t border-[#e0e8e5] pt-4"><input type="hidden" name="aza_id" value={aza.id} /><label className="block text-sm font-medium">Invite by email<input className={inputClass} name="email" type="email" required /></label><button className={`${buttonClass} mt-4`} disabled={inviting}>Send invitation</button><Feedback state={inviteState} /><Feedback state={revokeState} /></form>}</div>
    </section>
    <section className="rounded-2xl border border-[#cbd6d3] bg-white p-6"><h2 className="text-xl font-semibold">Withdrawals</h2><p className="mt-2 max-w-3xl text-sm text-[#506665]">The API provides the fee, net amount, availability time, and status. Only a backend status of settled confirms the bank credit.</p>{withdrawals.length ? <ul className="mt-4 divide-y divide-[#e0e8e5]">{withdrawals.map((item) => <li key={item.id} className="grid gap-2 py-4"><div><p className="font-semibold capitalize">{item.status.replaceAll("_", " ")}</p><p className="mt-1 text-sm">Gross ₦{item.gross_amount} · Fee ₦{item.fee_amount} · Net ₦{item.net_amount}</p><p className="mt-1 text-xs text-[#506665]">Available {new Date(item.available_at).toLocaleString()}{item.account_number_last4 ? ` · Account ending ${item.account_number_last4}` : ""}</p></div>{item.status === "requested" && <div className="grid gap-4 lg:grid-cols-2"><form action={confirmAction} className="rounded-xl bg-[#f3f5f1] p-4"><h3 className="font-semibold">Confirm bank destination</h3><input type="hidden" name="aza_id" value={aza.id} /><input type="hidden" name="withdrawal_id" value={item.id} /><label className="mt-3 block text-xs font-medium">Bank<select className={inputClass} name="bank_code" required defaultValue=""><option value="" disabled>Select a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label><label className="mt-3 block text-xs font-medium">Bank name<select className={inputClass} name="bank_name" required defaultValue=""><option value="" disabled>Select a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.name}>{bank.name}</option>)}</select></label><label className="mt-3 block text-xs font-medium">Account number<input className={inputClass} name="account_number" inputMode="numeric" maxLength={10} required /></label><label className="mt-3 block text-xs font-medium">Account name<input className={inputClass} name="account_name" required /></label><label className="mt-3 block text-xs font-medium">Beneficiary name<input className={inputClass} name="beneficiary_name" required /></label><label className="mt-3 block text-xs font-medium">Provider bank ID<input className={inputClass} name="provider_bank_id" required /></label><p className="mt-2 text-xs text-[#506665]">Use the provider’s registered bank identifier. AzaPay does not provide a lookup for this value.</p><button className={`${buttonClass} mt-4`} disabled={confirming}>Confirm payout details</button><Feedback state={confirmState} /></form><form action={cancelAction} className="self-start"><input type="hidden" name="aza_id" value={aza.id} /><input type="hidden" name="withdrawal_id" value={item.id} /><button className="text-sm font-semibold text-[#a54d2f] underline" disabled={cancelling}>Cancel request</button><Feedback state={cancelState} /></form></div>}</li>)}</ul> : <p className="mt-3 text-sm text-[#506665]">No withdrawals.</p>}
      <form action={withdrawalAction} className="mt-5 max-w-md border-t border-[#e0e8e5] pt-4"><input type="hidden" name="aza_id" value={aza.id} /><input type="hidden" name="idempotency_key" value={requestKey} /><label className="block text-sm font-medium">Gross amount<input className={inputClass} name="amount" inputMode="decimal" placeholder="1000.00" required /></label><button className={`${buttonClass} mt-4`} disabled={withdrawing}>Request withdrawal quote</button><Feedback state={withdrawalState} /><p className="mt-2 text-xs text-[#506665]">If the result is uncertain, refresh this page before submitting another request.</p></form>
    </section>
  </div>
}
