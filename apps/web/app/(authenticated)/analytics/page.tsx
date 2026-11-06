import Link from "next/link"
import { connection } from "next/server"
import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { ArrowRight } from "lucide-react"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import { getOverview, listCategories } from "@/src/features/dashboard/operations"
import type { Category, Overview } from "@/src/features/dashboard/schemas"
import { getFlow, getFlowHistory, getFlowUpcoming } from "@/src/features/flow/operations"
import type { FlowHistory, FlowUpcoming } from "@/src/features/flow/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"

export const metadata = { title: "Analytics | AzaPay" }

type AnalyticsData = {
  readonly overview: Overview
  readonly categories: Category[]
  readonly upcoming: Outcome<FlowUpcoming[]>
  readonly history: Outcome<FlowHistory[]>
}

/** Read API-owned totals and categories for the analytics screen. */
function* loadAnalytics(): Operation<Outcome<AnalyticsData>> {
  const overview = yield* getOverview()
  if (overview._tag === "Left") return left(overview.left)
  const categories = yield* listCategories()
  if (categories._tag === "Left") return left(categories.left)
  const flow = yield* getFlow()
  if (flow._tag === "Left") return left(flow.left)
  const upcoming = yield* getFlowUpcoming(flow.right.id)
  const history = yield* getFlowHistory(flow.right.id)
  return right({ overview: overview.right, categories: categories.right, upcoming, history })
}

/** Show summary values exactly as returned by the account API. */
export default async function AnalyticsPage({
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
      <main id="main-content" className="azapay-page p-8">
        <h1 className="azapay-display-title">Analytics unavailable</h1>
        <p className="azapay-muted mt-3">Please try again in a moment.</p>
      </main>
    )
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/analytics")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadAnalytics()
  })

  const flowCategories = outcome._tag === "Right"
    ? outcome.right.categories.filter((category) => category.domain_side === "flow")
    : []
  const azaCategories = outcome._tag === "Right"
    ? outcome.right.categories.filter((category) => category.domain_side === "aza")
    : []
  const matches = (name: string) => !query || name.toLowerCase().includes(query)
  const visibleFlow = flowCategories.filter((category) => matches(category.name))
  const visibleAza = azaCategories.filter((category) => matches(category.name))

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page">
      <div className="azapay-page-inner">
        <header className="mb-6">
          <p className="azapay-eyebrow">Your money</p>
          <h1 className="azapay-display-title mt-2">Analytics</h1>
          <p className="azapay-muted mt-2">How your money is spoken for.</p>
        </header>

        {outcome._tag === "Left" ? (
          <section className="azapay-panel"><p>Analytics are temporarily unavailable. Refresh to try again.</p></section>
        ) : (
          <>
            <nav aria-label="Analytics domain" className="mb-6 flex gap-2">
              <a className="rounded-full border border-[var(--bl)] bg-[var(--pi)] px-4 py-2 text-sm font-semibold text-[var(--bl)]" href="#flow">Flow</a>
              <a className="rounded-full border border-[var(--ln)] px-4 py-2 text-sm font-semibold text-[var(--mu)] transition-colors hover:border-[var(--bl)] hover:text-[var(--bl)]" href="#aza">Aza</a>
            </nav>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Account totals">
              <div className="azapay-stat"><small>Allocated per run</small><b>₦{outcome.right.overview.total_allocated_per_run}</b></div>
              <div className="azapay-stat"><small>Total executed</small><b>₦{outcome.right.overview.total_executed}</b></div>
              <div className="azapay-stat"><small>Total saved</small><b>₦{outcome.right.overview.total_saved}</b></div>
              <div className="azapay-stat"><small>Active categories</small><b>{outcome.right.overview.active_categories}</b></div>
            </section>

            <section id="flow" className="mt-10 scroll-mt-8">
              <div className="mb-8 grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--ink)]">Previous run</h2>
                  <p className="azapay-muted mt-1 text-sm">Most recently collected from Flow.</p>
                  {outcome.right.history._tag === "Left" ? (
                    <p className="azapay-muted mt-4 text-sm">Run history is temporarily unavailable.</p>
                  ) : outcome.right.history.right[0] ? (
                    <article className="azapay-item-card mt-4">
                      <div className="min-w-0 flex-1">
                        <strong>{outcome.right.history.right[0].category_name}</strong>
                        <p className="text-sm">{outcome.right.history.right[0].settled_at ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(outcome.right.history.right[0].settled_at)) : outcome.right.history.right[0].status}</p>
                      </div>
                      <strong className="tabular-nums">₦{outcome.right.history.right[0].total_amount}</strong>
                    </article>
                  ) : (
                    <p className="azapay-muted mt-4 text-sm">Nothing has run from Flow yet.</p>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--ink)]">Upcoming</h2>
                  <p className="azapay-muted mt-1 text-sm">Next scheduled pays from Flow.</p>
                  {outcome.right.upcoming._tag === "Left" ? (
                    <p className="azapay-muted mt-4 text-sm">Upcoming runs are temporarily unavailable.</p>
                  ) : outcome.right.upcoming.right.length ? (
                    outcome.right.upcoming.right.slice(0, 3).map((run) => (
                      <article className="azapay-item-card mt-4" key={`${run.category_id}:${run.next_run_at}`}>
                        <div className="min-w-0 flex-1">
                          <p className="azapay-eyebrow">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(run.next_run_at))}</p>
                          <strong>{run.category_name}</strong>
                        </div>
                        <strong className="tabular-nums">₦{run.amount}</strong>
                      </article>
                    ))
                  ) : (
                    <p className="azapay-muted mt-4 text-sm">No scheduled pays coming up.</p>
                  )}
                </div>
              </div>

              <h2 className="mb-1 text-lg font-extrabold text-[var(--ink)]">Categories &amp; pays</h2>
              <p className="azapay-muted mb-4 text-sm">Amounts and status supplied by your account.</p>
              <div className="azapay-item-list">
                {visibleFlow.length ? visibleFlow.map((category) => (
                  <article className="azapay-item-card" key={category.id}>
                    <div className="min-w-0 flex-1">
                      <strong>{category.name}</strong>
                      <p className="text-sm capitalize">{category.domain_side} · {category.frequency} · {category.status}</p>
                    </div>
                    <strong className="tabular-nums">₦{category.amount_per_run}</strong>
                  </article>
                )) : <p className="azapay-muted py-5">{query ? <>Nothing matches “{query}”.</> : "No Flow categories yet."}</p>}
              </div>
            </section>

            <section id="aza" className="mt-12 scroll-mt-8">
              <h2 className="mb-1 text-lg font-extrabold text-[var(--ink)]">Aza categories</h2>
              <p className="azapay-muted mb-4 text-sm">Savings goals and Aza categories in your account.</p>
              <div className="azapay-item-list">
                {visibleAza.length ? visibleAza.map((category) => (
                  <article className="azapay-item-card" key={category.id}>
                    <div className="min-w-0 flex-1">
                      <strong>{category.name}</strong>
                      <p className="text-sm">{category.frequency} · {category.status}</p>
                    </div>
                    <strong className="tabular-nums">₦{category.amount_per_run}</strong>
                  </article>
                )) : <p className="azapay-muted py-5">{query ? <>Nothing matches “{query}”.</> : "No Aza categories yet."}</p>}
              </div>
            </section>

            <p className="azapay-muted mt-8 text-sm">
              <Link className="inline-flex items-center gap-1.5 font-semibold text-[var(--bl)] hover:underline" href="/flow">Manage Flow instructions <ArrowRight size={16} aria-hidden="true" /></Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
