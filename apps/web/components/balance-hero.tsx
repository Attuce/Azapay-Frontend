"use client"

import { useState, useSyncExternalStore } from "react"
import { Eye, EyeOff, Plus } from "lucide-react"

const STORAGE_KEY = "azapay.hideBalance"
const noopSubscribe = () => () => undefined
const getHiddenSnapshot = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}
const getHiddenServerSnapshot = () => false

/**
 * Hero balance card. Amounts arrive as API money strings; this component only
 * toggles their visibility client-side and never derives financial state.
 * The action opens the shared Add dialog.
 */
export function BalanceHero({
  saved,
  allocatedPerRun,
  executed,
}: Readonly<{
  saved: string
  allocatedPerRun: string
  executed: string
}>) {
  const storedHidden = useSyncExternalStore(noopSubscribe, getHiddenSnapshot, getHiddenServerSnapshot)
  const [hiddenOverride, setHiddenOverride] = useState<boolean | null>(null)
  const hidden = hiddenOverride ?? storedHidden

  const toggle = () => {
    const next = !hidden
    setHiddenOverride(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      // Storage is optional; amounts stay visible for this session.
    }
  }

  const show = (value: string) => (hidden ? "₦ ••••" : `₦${value}`)

  return (
    <section className="azapay-hero" aria-label="Your money at a glance">
      <div className="azapay-hero-top">
        <span>Total saved</span>
        <button
          type="button"
          className="azapay-hero-toggle"
          aria-label={hidden ? "Show amounts" : "Hide amounts"}
          aria-pressed={hidden}
          onClick={toggle}
        >
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <p className="azapay-hero-amount">{show(saved)}</p>
      <p className="azapay-hero-caption">Saved across your Azas, as reported by your account.</p>

      <hr className="azapay-hero-divider" />

      <div className="azapay-hero-stats">
        <div className="azapay-hero-stat">
          <small>Allocated each run</small>
          <b>{show(allocatedPerRun)}</b>
        </div>
        <div className="azapay-hero-stat">
          <small>Total executed</small>
          <b>{show(executed)}</b>
        </div>
      </div>

      <button
        type="button"
        className="azapay-hero-action"
        onClick={() => document.dispatchEvent(new CustomEvent("azapay:add"))}
      >
        <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
        Set up a pay
      </button>
    </section>
  )
}
