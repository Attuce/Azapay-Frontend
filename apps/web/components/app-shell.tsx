"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Plus, Shield, Wallet, X } from "lucide-react"
import { logoutAction } from "@/app/auth/actions"

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/flow", label: "Flow", icon: Wallet },
  { href: "/azas", label: "Aza", icon: Shield },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

/** Shared signed-in navigation and the Add entry point for money journeys. */
export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const addDialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onAdd = () => setAddOpen(true)
    document.addEventListener("azapay:add", onAdd)
    return () => document.removeEventListener("azapay:add", onAdd)
  }, [])

  useEffect(() => {
    if (!addOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => [...(addDialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])]
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAddOpen(false)
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
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      previousFocus?.focus()
    }
  }, [addOpen])

  return (
    <div className="azapay-shell min-h-svh">
      <aside className="azapay-rail">
        {/* Full navigation keeps the shared shell in sync after the observed stale client transition. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="azapay-wordmark" aria-label="Azapay home">Azapay</a>
        <button className="azapay-add-button" onClick={() => setAddOpen(true)}>
          <Plus size={18} strokeWidth={2.2} /> Add
        </button>
        <nav aria-label="Main navigation" className="azapay-nav">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <a key={href} href={href} aria-current={active ? "page" : undefined} className={`azapay-nav-link${active ? " is-active" : ""}`}>
                <Icon size={20} strokeWidth={1.9} /> {label}
              </a>
            )
          })}
        </nav>
        <div className="azapay-rail-bottom">
          <p>Give every naira that comes into your life a destination.</p>
          <span>SET ONCE. RUNS ITSELF.</span>
          <div className="azapay-bottom-links">
            <a href="/funding">Funding</a>
            <a href="/settings">Settings</a>
          </div>
          <form action={logoutAction}>
            <button className="azapay-login-button">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="azapay-mobile-top">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="azapay-wordmark">Azapay</a>
        <button className="azapay-add-button" onClick={() => setAddOpen(true)}><Plus size={18} /> Add</button>
      </div>
      <nav aria-label="Mobile navigation" className="azapay-mobile-nav">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return <a key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></a>
        })}
      </nav>
      <div className="azapay-content">{children}</div>

      {addOpen ? (
        <div className="azapay-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddOpen(false) }}>
          <section ref={addDialogRef} className="azapay-modal" role="dialog" aria-modal="true" aria-labelledby="add-modal-title">
            <button className="azapay-modal-close" aria-label="Close" onClick={() => setAddOpen(false)}><X size={20} /></button>
            <h2 id="add-modal-title" className="azapay-display-title">Add something</h2>
            <p className="azapay-muted">What would you like to set up?</p>
            <a className="azapay-choice-card" href="/flow#add-pay" onClick={() => setAddOpen(false)}>
              <span className="azapay-choice-icon"><Wallet size={20} /></span>
              <span><strong>Add a pay</strong><small>Set up a payment to a bank account or Aza.</small></span>
            </a>
            <a className="azapay-choice-card" href="/flow#add-instruction" onClick={() => setAddOpen(false)}>
              <span className="azapay-choice-icon"><Shield size={20} /></span>
              <span><strong>Add a category</strong><small>Group payments and savings under a Flow category.</small></span>
            </a>
          </section>
        </div>
      ) : null}
    </div>
  )
}

/** Open the shared Add dialog from a page's primary action. */
export function AddTrigger({ className = "" }: { className?: string }) {
  return <button className={className} onClick={() => document.dispatchEvent(new CustomEvent("azapay:add"))}><span aria-hidden="true">＋</span> Add</button>
}
