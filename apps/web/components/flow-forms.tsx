"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import type { Outcome } from "@/src/application/errors"
import {
  archiveFlowCategoryAction,
  connectFlowAction,
  connectFlowCategoryAction,
  createFlowCategoryAction,
  createFlowPayAction,
  createFlowSaveAction,
  updateFlowCategoryDetailsAction,
  toggleFlowCategoryAction,
  updateFlowCategoryAmountAction,
  updateFlowAction,
  transitionFlowPayAction,
  transitionFlowSaveAction,
  updateFlowPayAction,
  updateFlowSaveAction,
  updateFlowPayDestinationAction,
  updateFlowSaveDestinationAction,
  type FlowFormState,
} from "@/app/(authenticated)/flow/actions"
import type { Category, Flow, FlowHistoryView, FlowUpcomingView } from "@/src/features/flow/schemas"
import type { FlowAzaOption, FlowBank, FlowPayView, FlowSave } from "@/src/features/flow/instruction-schemas"
import type { FundingConnection } from "@/src/features/funding/schemas"

const inputClass = "mt-2 h-11 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"

function Status({ state }: { state: FlowFormState }) {
  if (!state) return null

  return <p role={state.success ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-sm ${state.success ? "bg-[#e6f2ed] text-[#245b49]" : "bg-[#fff1eb] text-[#8c3c24]"}`}>{state.message}</p>
}

function CategoryCard({ category, flowArchived, fundingSources }: {
  category: Category
  flowArchived: boolean
  fundingSources: FundingConnection[]
}) {
  const [detailsState, detailsAction, detailsPending] = useActionState(updateFlowCategoryDetailsAction, null)
  const [amountState, amountAction, amountPending] = useActionState(updateFlowCategoryAmountAction, null)
  const [toggleState, toggleAction, togglePending] = useActionState(toggleFlowCategoryAction, null)
  const [archiveState, archiveAction, archivePending] = useActionState(archiveFlowCategoryAction, null)
  const [fundingState, fundingAction, fundingPending] = useActionState(connectFlowCategoryAction, null)
  const archived = category.status === "archived" || flowArchived

  return (
    <article className="rounded-2xl border border-[#dfe7e4] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <p className="mt-1 text-sm capitalize text-[#506665]">{category.frequency} · {category.status}</p>
          {category.description ? <p className="mt-2 text-sm text-[#506665]">{category.description}</p> : null}
          {category.next_run_at ? <p className="mt-2 text-xs text-[#506665]">Next run: {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(category.next_run_at))}</p> : null}
        </div>
        <p className="text-xl font-semibold">₦{category.amount_per_run}</p>
      </div>

      {!archived ? (
        <div className="mt-5 grid gap-4 border-t border-[#e5ece9] pt-4 md:grid-cols-[1fr_auto]">
          <form action={fundingAction} className="flex flex-wrap items-end gap-3 md:col-span-2">
            <input type="hidden" name="category_id" value={category.id} />
            <label className="min-w-56 flex-1 text-sm font-medium">Category funding source
              <select className={inputClass} name="funding_connection_id" defaultValue={category.default_funding_connection_id ?? ""}>
                <option value="">No category default</option>
                {fundingSources.filter((source) => source.status === "active").map((source) => (
                  <option key={source.id} value={source.id}>{source.bank_name ?? "Funding source"} ·••• {source.account_number_last4 ?? "••••"}</option>
                ))}
              </select>
            </label>
            <button disabled={fundingPending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{fundingPending ? "Saving…" : "Update source"}</button>
            <Status state={fundingState} />
          </form>

          <form action={detailsAction} className="grid gap-3 md:col-span-2 md:grid-cols-3">
            <input type="hidden" name="category_id" value={category.id} />
            <label className="text-sm font-medium">Name
              <input className={inputClass} name="name" maxLength={120} defaultValue={category.name} required />
            </label>
            <label className="text-sm font-medium">Frequency
              <select className={inputClass} name="frequency" defaultValue={category.frequency}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            </label>
            <label className="text-sm font-medium">Day of week (optional)
              <select className={inputClass} name="day_of_week" defaultValue={category.day_of_week?.toString() ?? ""}><option value="">No day selected</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
            </label>
            <label className="text-sm font-medium">Day of month (optional)
              <input className={inputClass} name="day_of_month" type="number" min={1} max={31} defaultValue={category.day_of_month ?? ""} />
            </label>
            <label className="text-sm font-medium">Description
              <input className={inputClass} name="description" maxLength={500} defaultValue={category.description ?? ""} />
            </label>
            <div className="md:col-span-3"><button disabled={detailsPending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{detailsPending ? "Saving…" : "Update details"}</button><Status state={detailsState} /></div>
          </form>

          <form action={amountAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="category_id" value={category.id} />
            <label className="min-w-48 flex-1 text-sm font-medium">Amount per run
              <input className={inputClass} name="amount_per_run" inputMode="decimal" pattern="[0-9]+\.[0-9]{2}" defaultValue={category.amount_per_run} required />
            </label>
            <button disabled={amountPending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{amountPending ? "Saving…" : "Update amount"}</button>
            <Status state={amountState} />
          </form>

          <div className="flex flex-wrap items-end gap-3">
            <form action={toggleAction}>
              <input type="hidden" name="category_id" value={category.id} />
              <input type="hidden" name="next_status" value={category.status === "paused" ? "active" : "paused"} />
              <button disabled={togglePending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{togglePending ? "Updating…" : category.status === "paused" ? "Resume" : "Pause"}</button>
              <Status state={toggleState} />
            </form>
            <form action={archiveAction}>
              <input type="hidden" name="category_id" value={category.id} />
              <button disabled={archivePending} className="h-11 rounded-full border border-[#c77a64] px-4 text-sm font-semibold text-[#8c3c24] disabled:opacity-60">{archivePending ? "Archiving…" : "Archive"}</button>
              <Status state={archiveState} />
            </form>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function PaymentInstructionCard({ pay, azas, banks }: { pay: FlowPayView; azas: FlowAzaOption[]; banks: FlowBank[] }) {
  const [updateState, updateAction, updatePending] = useActionState(updateFlowPayAction, null)
  const [transitionState, transitionAction, transitionPending] = useActionState(transitionFlowPayAction, null)
  const [destinationState, destinationAction, destinationPending] = useActionState(updateFlowPayDestinationAction, null)
  const canPause = pay.status === "scheduled" || pay.status === "ready"
  const canActivate = pay.status === "draft" || pay.status === "ready" || pay.status === "paused"

  return (
    <article className="rounded-2xl border border-[#dfe7e4] bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="font-semibold">{pay.beneficiary_name}</h3>
          <p className="mt-1 text-sm capitalize text-[#506665]">{pay.destination_type.replaceAll("_", " ")} · {pay.status}</p>
          <p className="mt-1 text-sm text-[#506665]">{pay.bank_name ?? (pay.aza_id ? "Aza destination" : "Destination details saved")}</p>
          {pay.destination_locked ? <p className="mt-1 text-xs text-[#506665]">Destination locked after first successful payment.</p> : null}
        </div>
        <p className="text-lg font-semibold">₦{pay.amount}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-[#e5ece9] pt-4">
        <form action={updateAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="pay_id" value={pay.id} />
          <label className="text-sm font-medium">Amount per run
            <input className={inputClass} name="amount" inputMode="decimal" pattern="[0-9]+\.[0-9]{2}" defaultValue={pay.amount} required />
          </label>
          <label className="text-sm font-medium">Memo
            <input className={inputClass} name="memo" maxLength={500} defaultValue={pay.memo ?? ""} />
          </label>
          <label className="text-sm font-medium">Frequency
            <select className={inputClass} name="frequency" defaultValue={pay.frequency ?? "monthly"}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
          </label>
          <label className="text-sm font-medium">Day of week
            <select className={inputClass} name="day_of_week" defaultValue={pay.day_of_week?.toString() ?? ""}><option value="">No day selected</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
          </label>
          <label className="text-sm font-medium">Day of month
            <input className={inputClass} name="day_of_month" type="number" min={1} max={31} defaultValue={pay.day_of_month ?? ""} />
          </label>
          <button disabled={updatePending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{updatePending ? "Saving…" : "Save payment"}</button>
          <Status state={updateState} />
        </form>
        {canPause || canActivate ? (
          <form action={transitionAction}>
            <input type="hidden" name="pay_id" value={pay.id} />
            <input type="hidden" name="action" value={canPause ? "pause" : "activate"} />
            <button disabled={transitionPending} className="h-11 rounded-full bg-[#193a3d] px-4 text-sm font-semibold text-white disabled:opacity-60">{transitionPending ? "Updating…" : canPause ? "Pause payment" : "Schedule payment"}</button>
            <Status state={transitionState} />
          </form>
        ) : null}
      </div>

      {!pay.destination_locked ? (
        <form action={destinationAction} className="mt-4 grid gap-3 border-t border-[#e5ece9] pt-4 md:grid-cols-3">
          <input type="hidden" name="pay_id" value={pay.id} />
          <label className="text-sm font-medium">Update destination type
            <select className={inputClass} name="destination_type" defaultValue={pay.destination_type}><option value="bank">Bank account</option><option value="aza">Aza</option><option value="shared_aza">Shared Aza</option></select>
          </label>
          <label className="text-sm font-medium">Bank
            <select className={inputClass} name="bank_code" defaultValue=""><option value="">Choose a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select>
          </label>
          <label className="text-sm font-medium">New account number
            <input className={inputClass} name="account_number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} />
          </label>
          <label className="text-sm font-medium">Aza
            <select className={inputClass} name="aza_id" defaultValue=""><option value="">Choose an Aza</option>{azas.map((aza) => <option key={aza.id} value={aza.id}>{aza.name}</option>)}</select>
          </label>
          <button disabled={destinationPending} className="h-11 self-end rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{destinationPending ? "Updating…" : "Update destination"}</button>
          <Status state={destinationState} />
        </form>
      ) : null}
    </article>
  )
}

function SaveInstructionCard({ save, azaName, azas }: { save: FlowSave; azaName: string; azas: FlowAzaOption[] }) {
  const [updateState, updateAction, updatePending] = useActionState(updateFlowSaveAction, null)
  const [transitionState, transitionAction, transitionPending] = useActionState(transitionFlowSaveAction, null)
  const [destinationState, destinationAction, destinationPending] = useActionState(updateFlowSaveDestinationAction, null)

  return (
    <article className="rounded-2xl border border-[#dfe7e4] bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="font-semibold">{save.name ?? azaName}</h3>
          <p className="mt-1 text-sm capitalize text-[#506665]">Saving to {azaName} · {save.status}</p>
          <p className="mt-1 text-sm text-[#506665]">{save.frequency ?? save.trigger} · {save.funding_complete ? "Funding ready" : "Funding needs attention"}</p>
        </div>
        <p className="text-lg font-semibold">₦{save.amount}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-[#e5ece9] pt-4">
        <form action={updateAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="save_id" value={save.id} />
          <label className="text-sm font-medium">Name
            <input className={inputClass} name="name" maxLength={120} defaultValue={save.name ?? ""} />
          </label>
          <label className="text-sm font-medium">Save mode
            <select className={inputClass} name="mode" defaultValue={save.mode}><option value="amount">Fixed amount</option><option value="share">Category share</option></select>
          </label>
          <label className="text-sm font-medium">Fixed amount per run
            <input className={inputClass} name="amount" inputMode="decimal" pattern="[0-9]+\.[0-9]{2}" defaultValue={save.mode === "amount" ? save.amount : ""} />
          </label>
          <label className="text-sm font-medium">Category share (%)
            <input className={inputClass} name="share_percent" inputMode="decimal" pattern="[0-9]{1,3}(\.[0-9]{1,6})?" defaultValue={save.share_percent ?? ""} />
          </label>
          <label className="text-sm font-medium">Trigger
            <select className={inputClass} name="trigger" defaultValue={save.trigger}><option value="scheduled">Scheduled</option><option value="manual">Manual</option><option value="payday">Payday</option></select>
          </label>
          <label className="text-sm font-medium">Frequency
            <select className={inputClass} name="frequency" defaultValue={save.frequency ?? "monthly"}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
          </label>
          <label className="text-sm font-medium">Day of week
            <select className={inputClass} name="day_of_week" defaultValue={save.day_of_week?.toString() ?? ""}><option value="">No day selected</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
          </label>
          <label className="text-sm font-medium">Day of month
            <input className={inputClass} name="day_of_month" type="number" min={1} max={31} defaultValue={save.day_of_month ?? ""} />
          </label>
          <button disabled={updatePending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{updatePending ? "Saving…" : "Save changes"}</button>
          <Status state={updateState} />
        </form>
        {save.status !== "processing" && save.status !== "successful" ? (
          <form action={transitionAction}>
            <input type="hidden" name="save_id" value={save.id} />
            <input type="hidden" name="next_status" value={save.paused ? "scheduled" : "paused"} />
            <button disabled={transitionPending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{transitionPending ? "Updating…" : save.paused ? "Resume saving" : "Pause saving"}</button>
            <Status state={transitionState} />
          </form>
        ) : null}
      </div>

      {!save.destination_locked ? (
        <form action={destinationAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#e5ece9] pt-4">
          <input type="hidden" name="save_id" value={save.id} />
          <label className="min-w-56 flex-1 text-sm font-medium">Update Aza destination
            <select className={inputClass} name="aza_id" defaultValue={save.aza_id}>{azas.map((aza) => <option key={aza.id} value={aza.id}>{aza.name}</option>)}</select>
          </label>
          <button disabled={destinationPending} className="h-11 rounded-full border border-[#193a3d] px-4 text-sm font-semibold text-[#193a3d] disabled:opacity-60">{destinationPending ? "Updating…" : "Update destination"}</button>
          <Status state={destinationState} />
        </form>
      ) : null}
    </article>
  )
}

function FlowChildInstructions({
  categories,
  fundingSources,
  pays,
  saves,
  azas,
  banks,
  archived,
}: {
  categories: Category[]
  fundingSources: FundingConnection[]
  pays: Outcome<FlowPayView[]>
  saves: Outcome<FlowSave[]>
  azas: Outcome<FlowAzaOption[]>
  banks: Outcome<FlowBank[]>
  archived: boolean
}) {
  const [saveState, saveAction, savePending] = useActionState(createFlowSaveAction, null)
  const activeCategories = categories.filter((category) => category.status === "active")
  const availableAzas = azas._tag === "Right" ? azas.right.filter((aza) => aza.status === "open" || aza.status === "active") : []
  const azaNames = new Map((azas._tag === "Right" ? azas.right : []).map((aza) => [aza.id, aza.name]))
  const [payOpen, setPayOpen] = useState(false)
  const payDialogRef = useRef<HTMLElement>(null)
  const [payStep, setPayStep] = useState(0)
  const [payError, setPayError] = useState<string | null>(null)
  const [payFields, setPayFields] = useState({
    category_id: "",
    beneficiary_name: "",
    amount: "",
    destination_type: "bank" as "bank" | "aza" | "shared_aza",
    bank_code: "",
    account_number: "",
    aza_id: "",
    frequency: "monthly",
    day_of_week: "",
    day_of_month: "",
    funding_connection_id: "",
    memo: "",
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (window.location.hash === "#add-pay") setPayOpen(true)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!payOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => [...(payDialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([type="hidden"]), select') ?? [])]
    payDialogRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), select')?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPayOpen(false)
        setPayError(null)
        return
      }
      if (event.key !== "Tab") return
      const items = focusable()
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      window.removeEventListener("keydown", closeOnEscape)
      previousFocus?.focus()
    }
  }, [payOpen])

  const [payState, payAction, payPending] = useActionState(async (previousState: FlowFormState, formData: FormData) => {
    const result = await createFlowPayAction(previousState, formData)
    if (result?.success) {
      setPayOpen(false)
      setPayStep(0)
      setPayFields({
        category_id: "",
        beneficiary_name: "",
        amount: "",
        destination_type: "bank",
        bank_code: "",
        account_number: "",
        aza_id: "",
        frequency: "monthly",
        day_of_week: "",
        day_of_month: "",
        funding_connection_id: "",
        memo: "",
      })
    }
    return result
  }, null)

  const setPayValue = (field: keyof typeof payFields, value: string) => {
    setPayFields((current) => ({ ...current, [field]: value }))
    setPayError(null)
  }

  const advancePay = () => {
    if (payStep === 0) {
      if (!payFields.category_id || !payFields.beneficiary_name.trim() || !/^(?=.*[1-9])\d{1,16}\.\d{2}$/.test(payFields.amount)) {
        setPayError("Add a payee, choose its Flow category, and enter a non-zero amount with two decimal places.")
        return
      }
    }
    if (payStep === 1) {
      const validBank = payFields.bank_code && /^\d{10}$/.test(payFields.account_number)
      const validAza = payFields.aza_id
      if (payFields.destination_type === "bank" ? !validBank : !validAza) {
        setPayError(payFields.destination_type === "bank" ? "Choose a bank and enter its 10-digit account number." : "Choose an Aza destination.")
        return
      }
    }
    setPayError(null)
    setPayStep((current) => Math.min(current + 1, 3))
  }

  const selectedCategory = activeCategories.find((category) => category.id === payFields.category_id)
  const selectedBank = banks._tag === "Right" ? banks.right.find((bank) => bank.code === payFields.bank_code) : undefined
  const selectedAza = availableAzas.find((aza) => aza.id === payFields.aza_id)

  const closePayWizard = () => {
    setPayOpen(false)
    setPayError(null)
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Payments and savings</h2>
        <p className="mt-1 text-sm text-[#506665]">Create payment or saving instructions inside a Flow category. The API decides readiness and execution.</p>
      </div>

      {!archived && activeCategories.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div id="add-pay" className="azapay-pay-launch scroll-mt-8">
            <div className="azapay-pay-launch-copy"><h3 className="font-semibold">Payments</h3><p className="mt-1 text-sm text-[#506665]">Set up a payment to a bank account or Aza.</p></div>
            <button type="button" onClick={() => { setPayError(null); setPayOpen(true) }} className="azapay-add-button mt-4">＋ Add a pay</button>
            <Status state={payState} />
          </div>

          {payOpen ? (
            <div className="azapay-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePayWizard() }}>
              <section ref={payDialogRef} className="azapay-modal azapay-pay-wizard" role="dialog" aria-modal="true" aria-labelledby="pay-wizard-title">
                <div className="azapay-wizard-topline">
                  <button type="button" aria-label="Go back" disabled={payStep === 0} onClick={() => { setPayError(null); setPayStep((current) => Math.max(current - 1, 0)) }}>←</button>
                  <span>STEP {payStep + 1} OF 4</span>
                  <button type="button" aria-label="Close" onClick={closePayWizard}>×</button>
                </div>
                <form action={payAction} className="azapay-wizard-form">
                  <input type="hidden" name="category_id" value={payFields.category_id} />
                  <input type="hidden" name="beneficiary_name" value={payFields.beneficiary_name} />
                  <input type="hidden" name="amount" value={payFields.amount} />
                  <input type="hidden" name="destination_type" value={payFields.destination_type} />
                  <input type="hidden" name="bank_code" value={payFields.bank_code} />
                  <input type="hidden" name="bank_name" value={selectedBank?.name ?? ""} />
                  <input type="hidden" name="account_number" value={payFields.account_number} />
                  <input type="hidden" name="aza_id" value={payFields.aza_id} />
                  <input type="hidden" name="frequency" value={payFields.frequency} />
                  <input type="hidden" name="day_of_week" value={payFields.day_of_week} />
                  <input type="hidden" name="day_of_month" value={payFields.day_of_month} />
                  <input type="hidden" name="funding_connection_id" value={payFields.funding_connection_id} />
                  <input type="hidden" name="memo" value={payFields.memo} />

                  {payStep === 0 ? <>
                    <h2 id="pay-wizard-title" className="azapay-display-title">Add a pay</h2>
                    <p className="azapay-muted">Name the payment, choose its Flow category, and set the amount.</p>
                    <label className="azapay-field-label">PAYEE NAME<input className={inputClass} value={payFields.beneficiary_name} maxLength={200} onChange={(event) => setPayValue("beneficiary_name", event.target.value)} placeholder="e.g. Rent" /></label>
                    <label className="azapay-field-label">FLOW CATEGORY<select className={inputClass} value={payFields.category_id} onChange={(event) => setPayValue("category_id", event.target.value)}><option value="">Choose a category</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <label className="azapay-field-label">AMOUNT PER RUN (₦)<input className={inputClass} inputMode="decimal" value={payFields.amount} onChange={(event) => setPayValue("amount", event.target.value)} placeholder="2500.00" /></label>
                  </> : null}

                  {payStep === 1 ? <>
                    <h2 id="pay-wizard-title" className="azapay-display-title">Where should it go?</h2>
                    <p className="azapay-muted">Send to a bank account or move money into one of your Azas.</p>
                    <div className="azapay-choice-pills" role="group" aria-label="Destination type">
                      <button type="button" aria-pressed={payFields.destination_type === "bank"} onClick={() => { setPayValue("destination_type", "bank"); setPayValue("aza_id", "") }}>Bank account</button>
                      <button type="button" aria-pressed={payFields.destination_type === "aza"} onClick={() => { setPayValue("destination_type", "aza"); setPayValue("bank_code", ""); setPayValue("account_number", "") }}>Aza</button>
                      <button type="button" aria-pressed={payFields.destination_type === "shared_aza"} onClick={() => { setPayValue("destination_type", "shared_aza"); setPayValue("bank_code", ""); setPayValue("account_number", "") }}>Shared Aza</button>
                    </div>
                    {payFields.destination_type === "bank" ? <>
                      <label className="azapay-field-label">BANK<select className={inputClass} value={payFields.bank_code} onChange={(event) => setPayValue("bank_code", event.target.value)}><option value="">Choose a bank</option>{banks._tag === "Right" ? banks.right.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>) : null}</select></label>
                      <label className="azapay-field-label">ACCOUNT NUMBER<input className={inputClass} inputMode="numeric" maxLength={10} value={payFields.account_number} onChange={(event) => setPayValue("account_number", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digits" /></label>
                    </> : <label className="azapay-field-label">AZA DESTINATION<select className={inputClass} value={payFields.aza_id} onChange={(event) => setPayValue("aza_id", event.target.value)}><option value="">Choose an Aza</option>{availableAzas.map((aza) => <option key={aza.id} value={aza.id}>{aza.name}</option>)}</select></label>}
                    <p className="azapay-muted text-sm">The destination can be changed only while the backend reports it as unlocked.</p>
                  </> : null}

                  {payStep === 2 ? <>
                    <h2 id="pay-wizard-title" className="azapay-display-title">When should it run?</h2>
                    <p className="azapay-muted">Choose the schedule for this payment.</p>
                    <label className="azapay-field-label">FREQUENCY<select className={inputClass} value={payFields.frequency} onChange={(event) => setPayValue("frequency", event.target.value)}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
                    {payFields.frequency === "weekly" ? <label className="azapay-field-label">DAY OF WEEK<select className={inputClass} value={payFields.day_of_week} onChange={(event) => setPayValue("day_of_week", event.target.value)}><option value="">Choose a day (optional)</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label> : null}
                    {payFields.frequency === "monthly" ? <label className="azapay-field-label">DAY OF MONTH<input className={inputClass} type="number" min={1} max={31} value={payFields.day_of_month} onChange={(event) => setPayValue("day_of_month", event.target.value)} placeholder="Optional" /></label> : null}
                    <label className="azapay-field-label">FUNDING SOURCE<select className={inputClass} value={payFields.funding_connection_id} onChange={(event) => setPayValue("funding_connection_id", event.target.value)}><option value="">Use category or Flow default</option>{fundingSources.filter((source) => source.status === "active").map((source) => <option key={source.id} value={source.id}>{source.bank_name ?? "Funding source"} ·••• {source.account_number_last4 ?? "••••"}</option>)}</select></label>
                    <label className="azapay-field-label">MEMO (OPTIONAL)<input className={inputClass} value={payFields.memo} maxLength={500} onChange={(event) => setPayValue("memo", event.target.value)} /></label>
                  </> : null}

                  {payStep === 3 ? <>
                    <h2 id="pay-wizard-title" className="azapay-display-title">Review</h2>
                    <dl className="azapay-review-list">
                      <div><dt>Payee</dt><dd>{payFields.beneficiary_name}</dd></div>
                      <div><dt>Category</dt><dd>{selectedCategory?.name ?? "—"}</dd></div>
                      <div><dt>Amount</dt><dd>₦{payFields.amount}</dd></div>
                      <div><dt>Destination</dt><dd>{payFields.destination_type === "bank" ? `${selectedBank?.name ?? "Bank"} ·••• ${payFields.account_number.slice(-4)}` : selectedAza?.name ?? "—"}</dd></div>
                      <div><dt>Runs</dt><dd>{payFields.frequency}{payFields.day_of_week ? ` · ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(payFields.day_of_week)]}` : ""}{payFields.day_of_month ? ` · Day ${payFields.day_of_month}` : ""}</dd></div>
                    </dl>
                    <p className="azapay-lock-note">The API determines readiness and whether this payment can be scheduled. Review the payment status after creating it.</p>
                  </> : null}

                  {payError ? <p className="azapay-form-error" role="alert">{payError}</p> : null}
                  <Status state={payState} />
                  {payStep < 3 ? <button type="button" className="azapay-wizard-primary" onClick={advancePay}>Continue</button> : <button type="submit" className="azapay-wizard-primary" disabled={payPending}>{payPending ? "Creating…" : "Create pay"}</button>}
                </form>
              </section>
            </div>
          ) : null}

          <form action={saveAction} className="grid content-start gap-4 rounded-2xl border border-[#cbd6d3] bg-white p-5">
            <h3 className="font-semibold">Add a saving</h3>
            <label className="text-sm font-medium">Flow category
              <select className={inputClass} name="category_id" required><option value="">Choose category</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            </label>
            <label className="text-sm font-medium">Save into Aza
              <select className={inputClass} name="aza_id" required><option value="">Choose an Aza</option>{availableAzas.map((aza) => <option key={aza.id} value={aza.id}>{aza.name}</option>)}</select>
            </label>
            <label className="text-sm font-medium">Save mode
              <select className={inputClass} name="mode" defaultValue="amount"><option value="amount">Fixed amount</option><option value="share">Share of category amount</option></select>
            </label>
            <label className="text-sm font-medium">Fixed amount per run (₦)
              <input className={inputClass} name="amount" inputMode="decimal" pattern="[0-9]+\.[0-9]{2}" placeholder="2500.00" />
            </label>
            <label className="text-sm font-medium">Category share (%)
              <input className={inputClass} name="share_percent" inputMode="decimal" pattern="[0-9]{1,3}(\.[0-9]{1,6})?" placeholder="10" />
            </label>
            <label className="text-sm font-medium">Trigger
              <select className={inputClass} name="trigger" defaultValue="scheduled"><option value="scheduled">Scheduled</option><option value="manual">Manual</option><option value="payday">Payday</option></select>
            </label>
            <label className="text-sm font-medium">Frequency
              <select className={inputClass} name="frequency" defaultValue="monthly"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            </label>
            <label className="text-sm font-medium">Day of week (optional)
              <select className={inputClass} name="day_of_week" defaultValue=""><option value="">No day selected</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
            </label>
            <label className="text-sm font-medium">Day of month (optional)
              <input className={inputClass} name="day_of_month" type="number" min={1} max={31} />
            </label>
            <label className="text-sm font-medium">Funding source (optional)
              <select className={inputClass} name="funding_connection_id" defaultValue=""><option value="">Use category or Flow default</option>{fundingSources.filter((source) => source.status === "active").map((source) => <option key={source.id} value={source.id}>{source.bank_name ?? "Funding source"} ·••• {source.account_number_last4 ?? "••••"}</option>)}</select>
            </label>
            <label className="text-sm font-medium">Name (optional)
              <input className={inputClass} name="name" maxLength={120} />
            </label>
            <label className="text-sm font-medium">Memo (optional)
              <input className={inputClass} name="memo" maxLength={500} />
            </label>
            <button disabled={savePending || availableAzas.length === 0} className="h-11 rounded-full bg-[#193a3d] px-4 text-sm font-semibold text-white disabled:opacity-60">{savePending ? "Creating…" : "Create saving"}</button>
            {azas._tag === "Left" ? <p className="text-sm text-[#8c3c24]">Azas are temporarily unavailable.</p> : availableAzas.length === 0 ? <p className="text-sm text-[#506665]">Create an Aza before adding a saving instruction.</p> : null}
            <Status state={saveState} />
          </form>
        </div>
      ) : !archived ? (
        <div id="add-pay" className="azapay-pay-launch scroll-mt-8">
          <h3 className="font-semibold">Create a Flow category first</h3>
          <p className="mt-1 max-w-xl text-sm text-[#506665]">Every payment belongs to a category. Add one, then return here to set up its payment.</p>
          <a className="mt-4 inline-flex rounded-full border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-300/10" href="#add-instruction">Add a category</a>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-semibold">Payments</h3>
        {pays._tag === "Left" ? <p className="rounded-xl border border-[#cbd6d3] bg-white p-4 text-sm text-[#506665]">Payments are temporarily unavailable.</p> : pays.right.length === 0 ? <p className="rounded-xl border border-[#cbd6d3] bg-white p-4 text-sm text-[#506665]">No payments in Flow yet.</p> : pays.right.map((pay) => <PaymentInstructionCard key={pay.id} pay={pay} azas={availableAzas} banks={banks._tag === "Right" ? banks.right : []} />)}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Savings</h3>
        {saves._tag === "Left" ? <p className="rounded-xl border border-[#cbd6d3] bg-white p-4 text-sm text-[#506665]">Savings are temporarily unavailable.</p> : saves.right.length === 0 ? <p className="rounded-xl border border-[#cbd6d3] bg-white p-4 text-sm text-[#506665]">No savings in Flow yet.</p> : saves.right.map((save) => <SaveInstructionCard key={save.id} save={save} azaName={azaNames.get(save.aza_id) ?? "Aza"} azas={availableAzas} />)}
      </div>
    </section>
  )
}

/** Create and manage backend-owned Flow spending and saving instructions. */
export function FlowJourney({ flow, categories, fundingSources, upcoming, history, pays, saves, azas, banks }: {
  flow: Flow
  categories: Category[]
  fundingSources: FundingConnection[]
  upcoming: Outcome<FlowUpcomingView[]>
  history: Outcome<FlowHistoryView[]>
  pays: Outcome<FlowPayView[]>
  saves: Outcome<FlowSave[]>
  azas: Outcome<FlowAzaOption[]>
  banks: Outcome<FlowBank[]>
}) {
  const [createState, createAction, createPending] = useActionState(createFlowCategoryAction, null)
  const [flowState, flowAction, flowPending] = useActionState(updateFlowAction, null)
  const [flowFundingState, flowFundingAction, flowFundingPending] = useActionState(connectFlowAction, null)
  const flowCategories = categories.filter((category) => category.domain_side === "flow")

  return (
    <div className="space-y-8">
      {flow.status !== "archived" ? (
        <form action={flowAction} className="grid gap-4 rounded-2xl border border-[#cbd6d3] bg-white p-6 md:grid-cols-3">
          <div className="md:col-span-3">
            <h2 className="text-xl font-semibold">Flow settings</h2>
            <p className="mt-1 text-sm text-[#506665]">Pausing Flow affects the domain status. The API controls which instructions can run.</p>
          </div>
          <label className="text-sm font-medium">Name
            <input className={inputClass} name="name" maxLength={120} defaultValue={flow.name} required />
          </label>
          <label className="text-sm font-medium">Description
            <input className={inputClass} name="description" maxLength={500} defaultValue={flow.description ?? ""} />
          </label>
          <label className="text-sm font-medium">Status
            <select className={inputClass} name="status" defaultValue={flow.status}><option value="active">Active</option><option value="paused">Paused</option></select>
          </label>
          <Status state={flowState} />
          <div><button disabled={flowPending} className="rounded-full border border-[#193a3d] px-5 py-3 font-semibold text-[#193a3d] disabled:opacity-60">{flowPending ? "Saving…" : "Save Flow settings"}</button></div>
        </form>
      ) : null}

      {flow.status !== "archived" ? (
        <form action={flowFundingAction} className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
          <input type="hidden" name="flow_id" value={flow.id} />
          <label className="block max-w-xl text-sm font-medium">Flow default funding source
            <select className={inputClass} name="funding_connection_id" defaultValue={flow.default_funding_connection_id ?? ""}>
              <option value="">No default source</option>
              {fundingSources.filter((source) => source.status === "active").map((source) => (
                <option key={source.id} value={source.id}>{source.bank_name ?? "Funding source"} ·••• {source.account_number_last4 ?? "••••"}</option>
              ))}
            </select>
          </label>
          <button disabled={flowFundingPending} className="mt-4 rounded-full border border-[#193a3d] px-5 py-3 font-semibold text-[#193a3d] disabled:opacity-60">{flowFundingPending ? "Saving…" : "Update Flow source"}</button>
          <Status state={flowFundingState} />
        </form>
      ) : null}

      {flow.status !== "archived" ? <form id="add-instruction" action={createAction} className="grid gap-5 rounded-2xl border border-[#cbd6d3] bg-white p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold">Create an instruction</h2>
          <p className="mt-1 text-sm text-[#506665]">Set the amount and schedule. The API determines readiness and execution outcomes.</p>
        </div>
        <label className="text-sm font-medium">Name
          <input className={inputClass} name="name" maxLength={120} required />
        </label>
        <label className="text-sm font-medium">Amount per run (₦)
          <input className={inputClass} name="amount_per_run" inputMode="decimal" pattern="[0-9]+\.[0-9]{2}" placeholder="2500.00" required />
        </label>
        <label className="text-sm font-medium">Frequency
          <select className={inputClass} name="frequency" defaultValue="monthly"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
        </label>
        <label className="text-sm font-medium">Day of week (optional)
          <select className={inputClass} name="day_of_week" defaultValue=""><option value="">No day selected</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
        </label>
        <label className="text-sm font-medium">Day of month (optional)
          <input className={inputClass} name="day_of_month" type="number" min={1} max={31} />
        </label>
        <label className="text-sm font-medium">Description (optional)
          <input className={inputClass} name="description" maxLength={500} />
        </label>
        <Status state={createState} />
        <div><button disabled={createPending} className="rounded-full bg-[#193a3d] px-5 py-3 font-semibold text-white disabled:opacity-60">{createPending ? "Creating…" : "Create instruction"}</button></div>
      </form> : <p className="rounded-2xl border border-[#cbd6d3] bg-white p-5 text-sm text-[#506665]">Flow is archived. Its instructions are shown for reference.</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Flow instructions</h2>
        {flowCategories.length ? flowCategories.map((category) => <CategoryCard key={category.id} category={category} flowArchived={flow.status === "archived"} fundingSources={fundingSources} />) : <p className="rounded-2xl border border-[#cbd6d3] bg-white p-6 text-sm text-[#506665]">No Flow instructions yet. Create one to get started.</p>}
      </section>

      <FlowChildInstructions categories={flowCategories} fundingSources={fundingSources} pays={pays} saves={saves} azas={azas} banks={banks} archived={flow.status === "archived"} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming runs</h2>
        {upcoming._tag === "Left" ? (
          <p className="rounded-2xl border border-[#cbd6d3] bg-white p-5 text-sm text-[#506665]">Upcoming runs are temporarily unavailable.</p>
        ) : upcoming.right.length === 0 ? (
          <p className="rounded-2xl border border-[#cbd6d3] bg-white p-5 text-sm text-[#506665]">There are no upcoming runs.</p>
        ) : upcoming.right.map((run) => (
          <article key={`${run.category_id}:${run.next_run_at}`} className="rounded-2xl border border-[#dfe7e4] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{run.category_name}</h3>
                <p className="mt-1 text-sm text-[#506665]">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(run.next_run_at))} · {run.frequency}</p>
              </div>
              <p className="text-lg font-semibold">₦{run.amount}</p>
            </div>

            <div className="mt-4 grid gap-4 border-t border-[#e5ece9] pt-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Readiness: {run.readiness.ready ? "Ready" : "Needs attention"}</p>
                {run.readiness.issues.length ? <ul className="mt-2 list-inside list-disc text-sm text-[#8c3c24]">{run.readiness.issues.map((issue, index) => <li key={`${index}:${issue}`}>{issue}</li>)}</ul> : null}
              </div>
              <div>
                <p className="text-sm font-semibold">Funding: {run.funding.fundable ? "Available" : "Needs attention"}</p>
                <p className="mt-1 text-sm text-[#506665]">{run.funding.bank_name ?? run.funding.message ?? "No funding source details"}{run.funding.account_number_last4 ? ` ·••• ${run.funding.account_number_last4}` : ""}</p>
              </div>
            </div>

            {run.destinations.length ? (
              <ul className="mt-4 space-y-2 border-t border-[#e5ece9] pt-4 text-sm">
                {run.destinations.map((destination) => (
                  <li key={destination.pay_id} className="flex flex-wrap justify-between gap-2">
                    <span>{destination.beneficiary_name ?? destination.bank_name ?? destination.destination_type ?? "Destination"}</span>
                    {destination.amount ? <span>₦{destination.amount}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Run history</h2>
        {history._tag === "Left" ? (
          <p className="rounded-2xl border border-[#cbd6d3] bg-white p-5 text-sm text-[#506665]">Run history is temporarily unavailable.</p>
        ) : history.right.length === 0 ? (
          <p className="rounded-2xl border border-[#cbd6d3] bg-white p-5 text-sm text-[#506665]">There are no previous runs.</p>
        ) : history.right.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-[#dfe7e4] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{entry.category_name}</h3>
                <p className="mt-1 text-sm capitalize text-[#506665]">{entry.status} · {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(entry.created_at))}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">₦{entry.total_amount}</p>
                <p className="text-xs text-[#506665]">Fee ₦{entry.fee}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e5ece9] pt-4 text-sm text-[#506665]">
              <span>Recovery: {entry.recovery_status}</span>
              {entry.recovery_attempts !== null && entry.recovery_attempts !== undefined ? <span>Recovery attempts: {entry.recovery_attempts}</span> : null}
              {entry.settled_at ? <span>Settled {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(entry.settled_at))}</span> : null}
              {entry.failure_reason ? <span className="text-[#8c3c24]">{entry.failure_reason}</span> : null}
            </div>

            {entry.children.length ? (
              <ul className="mt-4 space-y-2 border-t border-[#e5ece9] pt-4 text-sm">
                {entry.children.map((child) => (
                  <li key={child.id} className="flex flex-wrap justify-between gap-2">
                    <span>{child.beneficiary_name ?? child.account_name ?? child.bank_name ?? child.destination_type ?? "Destination"} · {child.item_status ?? child.status}</span>
                    <span>₦{child.amount}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  )
}
