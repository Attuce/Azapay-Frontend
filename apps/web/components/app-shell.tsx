"use client"

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BarChart3,
  ChevronDown,
  ChevronsLeft,
  Home,
  Landmark,
  Lightbulb,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Shield,
  Wallet,
  X,
} from "lucide-react"
import { logoutAction } from "@/app/auth/actions"
import { LogoMark } from "@/components/logo"

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/flow", label: "Flow", icon: Wallet },
  { href: "/azas", label: "Azas", icon: Shield },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

export type ShellUser = { readonly fullName: string; readonly email: string }

/**
 * Debounced, URL-driven search. Authenticated pages filter the lists they
 * render against the `q` query parameter, so the header search works on every
 * screen without inventing backend endpoints.
 */
function SearchBoxInner() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [value, setValue] = useState(query)
  const [lastQuery, setLastQuery] = useState(query)
  if (lastQuery !== query) {
    setLastQuery(query)
    setValue(query)
  }

  useEffect(() => {
    const trimmed = value.trim()
    const current = searchParams.get("q") ?? ""
    if (trimmed === current) return undefined
    const timeout = window.setTimeout(() => {
      router.replace(trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname, { scroll: false })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [value, pathname, router, searchParams])

  return (
    <label className="azapay-search">
      <Search size={20} aria-hidden="true" />
      <input
        id="shell-search"
        type="search"
        placeholder="Search for anything…"
        aria-label="Search"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {value ? (
        <button type="button" className="azapay-search-clear" aria-label="Clear search" onClick={() => setValue("")}>
          <X size={16} />
        </button>
      ) : null}
    </label>
  )
}

function SearchBox() {
  return (
    <Suspense fallback={<div className="azapay-search" aria-hidden="true" />}>
      <SearchBoxInner />
    </Suspense>
  )
}

/** Account menu: funding, settings, and sign out. */
function UserMenu({ user }: { readonly user: ShellUser }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "A"

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div className="azapay-user" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="azapay-user-trigger"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="azapay-avatar" aria-hidden="true">{initials}</span>
        <span className="azapay-user-meta">
          <b>{user.fullName}</b>
          <small>{user.email}</small>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div className="azapay-menu" role="menu" aria-label="Account">
          <Link href="/funding" role="menuitem" onClick={() => setOpen(false)}><Landmark size={18} aria-hidden="true" /> Funding</Link>
          <Link href="/settings" role="menuitem" onClick={() => setOpen(false)}><Settings size={18} aria-hidden="true" /> Settings</Link>
          <form action={logoutAction}>
            <button type="submit" role="menuitem"><LogOut size={18} aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

/** Help card; the message opens WhatsApp with the customer's text prefilled. */
function HelpCard() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLFormElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const openButton = openButtonRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector("textarea")?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        setOpen(false)
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>("textarea, button[type=submit], button[data-close]")]
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
    document.addEventListener("keydown", onKeyDown)
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.documentElement.style.overflow = ""
      ;(previousFocus ?? openButton)?.focus()
    }
  }, [open])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setError("Write your message first.")
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(trimmed)}`, "_blank", "noopener,noreferrer")
    setOpen(false)
    setMessage("")
    setError(null)
  }

  return (
    <div className="azapay-help">
      <span className="azapay-help-badge" aria-hidden="true"><Lightbulb size={28} strokeWidth={1.7} /></span>
      <h3>Need assistance?</h3>
      <p>Having issues using AzaPay? Send us a message on WhatsApp and we will help.</p>
      <button ref={openButtonRef} type="button" className="azapay-help-btn" onClick={() => setOpen(true)}>
        Write a message
      </button>

      {open ? (
        <div className="azapay-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <form
            ref={dialogRef}
            className="azapay-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            onSubmit={submit}
            noValidate
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="help-modal-title" className="text-xl font-extrabold text-[var(--ink)]">Write a message</h2>
              <button type="button" className="azapay-modal-close" aria-label="Close" data-close onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <textarea
              className="field"
              rows={4}
              placeholder="How can we help?"
              aria-label="Your message"
              value={message}
              onChange={(event) => { setMessage(event.target.value); setError(null) }}
            />
            {error ? <p className="azapay-form-error" role="alert">{error}</p> : null}
            <button type="submit" className="btn-primary w-full">Send on WhatsApp</button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

/** Shared signed-in shell: sidebar, header, content, and the Add entry point. */
const SIDEBAR_KEY = "azapay.sidebar"
const noopSubscribe = () => () => undefined
const getSidebarSnapshot = () => {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "collapsed"
  } catch {
    return false
  }
}
const getSidebarServerSnapshot = () => false

export function AppShell({ children, user }: Readonly<{ children: React.ReactNode; user?: ShellUser }>) {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const storedCollapsed = useSyncExternalStore(noopSubscribe, getSidebarSnapshot, getSidebarServerSnapshot)
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null)
  const collapsed = collapsedOverride ?? storedCollapsed
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)
  const addDialogRef = useRef<HTMLElement>(null)

  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setDrawerOpen(false)
  }

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsedOverride(next)
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded")
    } catch {
      // Storage is optional; the shell still toggles for this session.
    }
  }

  useEffect(() => {
    const onAdd = () => setAddOpen(true)
    document.addEventListener("azapay:add", onAdd)
    return () => document.removeEventListener("azapay:add", onAdd)
  }, [])

  useEffect(() => {
    if (!addOpen) return undefined
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

  const shellClass = `azapay-shell${collapsed ? " is-collapsed" : ""}${drawerOpen ? " drawer-open" : ""}`

  return (
    <div className={shellClass}>
      <aside className="azapay-rail" aria-label="Sidebar">
        <div className="azapay-logo-row">
          <Link href="/" className="azapay-wordmark" aria-label="Azapay home">
            <LogoMark size={28} />
            <span className="azapay-wordmark-text">Azapay</span>
          </Link>
          <button
            type="button"
            className="azapay-icon-btn azapay-collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
          >
            <ChevronsLeft size={20} />
          </button>
        </div>

        <button type="button" className="azapay-add-button" onClick={() => setAddOpen(true)} aria-label="Add">
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
          <span className="azapay-nav-text">Add</span>
        </button>

        <nav aria-label="Main navigation" className="azapay-nav">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined} className={`azapay-nav-link${active ? " is-active" : ""}`}>
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                <span className="azapay-nav-text">{label}</span>
              </Link>
            )
          })}
        </nav>

        <HelpCard />
      </aside>

      <button type="button" className="azapay-scrim" aria-label="Close menu" tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />

      <div className="azapay-main">
        <header className="azapay-header">
          <button type="button" className="azapay-icon-btn azapay-hamburger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Menu size={26} />
          </button>
          <SearchBox />
          <UserMenu user={{ fullName: user?.fullName ?? "Your account", email: user?.email ?? "" }} />
        </header>

        <div className="azapay-content">{children}</div>
      </div>

      {addOpen ? (
        <div className="azapay-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddOpen(false) }}>
          <section ref={addDialogRef} className="azapay-modal" role="dialog" aria-modal="true" aria-labelledby="add-modal-title">
            <button type="button" className="azapay-modal-close absolute right-5 top-5" aria-label="Close" onClick={() => setAddOpen(false)}>
              <X size={20} />
            </button>
            <h2 id="add-modal-title" className="azapay-display-title text-2xl">Add something</h2>
            <p className="azapay-muted -mt-1">What would you like to set up?</p>
            <Link className="azapay-choice-card" href="/flow#add-pay" onClick={() => setAddOpen(false)}>
              <span className="azapay-choice-icon"><Wallet size={20} /></span>
              <span><strong>Add a pay</strong><small>Set up a payment to a bank account or Aza.</small></span>
            </Link>
            <Link className="azapay-choice-card" href="/flow#add-instruction" onClick={() => setAddOpen(false)}>
              <span className="azapay-choice-icon"><Shield size={20} /></span>
              <span><strong>Add a category</strong><small>Group payments and savings under a Flow category.</small></span>
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  )
}

/** Open the shared Add dialog from a page's primary action. */
export function AddTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      className={className || "azapay-add-button"}
      onClick={() => document.dispatchEvent(new CustomEvent("azapay:add"))}
    >
      <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add
    </button>
  )
}
