import Link from "next/link"
import { connection } from "next/server"
import { run } from "effection"
import { ArrowDownLeft, ArrowLeft, ChevronRight, Landmark, Mail } from "lucide-react"
import { AzaCollectionForms } from "@/components/aza-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { listAzas } from "@/src/features/aza/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"

export const metadata = { title: "Azas | AzaPay" }


/** Insert thousands separators into a contract money string without numeric conversion. */
function groupMoney(value: string): string {
  const match = /^(0|[1-9]\d*)\.\d{2}$/.exec(value)
  if (!match) return value
  const [whole = value, fraction = "00"] = value.split(".")
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`
}

/** Render the authenticated Aza list and create/accept journey. */
export default async function AzasPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly q?: string }>
}) {
  await connection()
  const config = loadServerConfig()
  const { q } = await searchParams
  const query = (q ?? "").trim().toLowerCase()

  if (!config) {
    return (
      <main id="main-content" tabIndex={-1} className="p-10">
        <h1 className="azapay-display-title">Azas unavailable</h1>
        <p className="azapay-muted mt-3">AzaPay is temporarily unavailable.</p>
      </main>
    )
  }

  const result = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/azas")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    const user = yield* currentUser()
    if (user._tag === "Left") return null
    const azas = yield* listAzas()
    return azas._tag === "Left" ? null : azas.right.map((aza) => ({ aza, isOwner: aza.owner_user_id === user.right.id }))
  })

  const visible = result?.filter(({ aza }) => !query || aza.name.toLowerCase().includes(query)) ?? []

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page">
      <div className="azapay-page-inner">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--bl)] hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Account
        </Link>

        <h1 className="azapay-display-title mt-4">Azas</h1>
        <p className="azapay-muted mt-2 max-w-2xl">A wallet is created automatically when you add an Aza category.</p>

        <section className="azapay-wallet-grid mt-8" aria-label="Your Azas">
          {visible.length ? visible.map(({ aza }) => (
            <article key={aza.id} className="azapay-wallet">
              <div className="azapay-wallet-top">
                <h2 className="azapay-wallet-name" title={aza.name}>{aza.name}</h2>
                <Mail size={18} aria-hidden="true" className="opacity-90" />
              </div>

              <div className="azapay-wallet-balance">
                <b title={aza.display_balance === null ? "Balance not provided by the backend" : undefined}>{aza.display_balance === null ? "Not provided" : `₦${groupMoney(aza.display_balance)}`}</b>
                <Link className="azapay-wallet-edit" href={`/azas/${aza.id}`}>Edit</Link>
              </div>

              <hr className="azapay-wallet-divider" />

              <div className="azapay-wallet-bank">
                <Landmark size={24} aria-hidden="true" className="opacity-95" />
                <span><strong>Funding source</strong><small>Needed for automatic pulls.</small></span>
                <Link href="/funding" className="azapay-wallet-connect">Connect</Link>
              </div>

              <Link href={`/azas/${aza.id}#contribute`} className="azapay-wallet-cta">
                <ArrowDownLeft size={18} strokeWidth={2.5} aria-hidden="true" /> Let money in
              </Link>

              <p className="azapay-wallet-note">Runs every pay and category tied to this Aza</p>
              <Link href="/flow" className="azapay-wallet-pays">View your pays <ChevronRight size={16} aria-hidden="true" /></Link>
            </article>
          )) : (
            <p className="azapay-panel text-sm text-[var(--mu)] sm:col-span-full">
              {query ? <>Nothing matches “{query}”.</> : "No Azas are available, or the list could not be loaded."}
            </p>
          )}
        </section>

        <div id="add-aza" className="mt-8 scroll-mt-8"><AzaCollectionForms /></div>
      </div>
    </main>
  )
}
