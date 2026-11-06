import Link from "next/link"
import { connection } from "next/server"
import { run } from "effection"
import { ArrowLeft, Shield } from "lucide-react"
import { AzaCollectionForms } from "@/components/aza-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { listAzas } from "@/src/features/aza/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"

export const metadata = { title: "Azas | AzaPay" }

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
        <p className="azapay-muted mt-2 max-w-2xl">Create and manage savings spaces, invite members, and review backend-provided contribution and withdrawal state.</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Your Azas">
          {visible.length ? visible.map(({ aza, isOwner }) => (
            <Link key={aza.id} href={`/azas/${aza.id}`} className="azapay-panel group transition-colors hover:border-[var(--bl)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="azapay-icon-badge"><Shield size={20} aria-hidden="true" /></span>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">{aza.name}</h2>
                </div>
                <span className="text-xs capitalize text-[var(--mu)]">{isOwner ? "Owner" : "Member"}</span>
              </div>
              <p className="mt-2 text-sm capitalize text-[var(--mu)]">{aza.visibility} · {aza.mode} · {aza.status}</p>
              <p className="mt-4 font-bold text-lg tabular-nums text-[var(--ink)]">{aza.display_balance === null ? "Balance not provided" : `₦${aza.display_balance}`}</p>
            </Link>
          )) : (
            <p className="azapay-panel text-sm text-[var(--mu)] sm:col-span-2">
              {query ? <>Nothing matches “{query}”.</> : "No Azas are available, or the list could not be loaded."}
            </p>
          )}
        </section>

        <div id="add-aza" className="mt-8 scroll-mt-8"><AzaCollectionForms /></div>
      </div>
    </main>
  )
}
