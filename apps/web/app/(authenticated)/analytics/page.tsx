import Link from "next/link"
import { connection } from "next/server"
import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
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
export default async function AnalyticsPage() {
  await connection()
  const config = loadServerConfig()
  if (!config) return <main id="main-content" className="azapay-page min-h-svh p-8"><h1 className="azapay-display-title">Analytics unavailable</h1><p className="mt-3 azapay-muted">Please try again in a moment.</p></main>

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/analytics")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadAnalytics()
  })

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page min-h-svh px-6 py-10">
      <div className="azapay-page-inner">
        <header className="mb-8">
          <p className="azapay-eyebrow">YOUR MONEY</p>
          <h1 className="azapay-display-title mt-2">Analytics</h1>
          <p className="azapay-muted mt-2">How your money is spoken for.</p>
        </header>
        {outcome._tag === "Left" ? (
          <section className="azapay-panel block"><p>Analytics are temporarily unavailable. Refresh to try again.</p></section>
        ) : (
          <>
            <nav aria-label="Analytics domain" className="mb-8 flex gap-3">
              <a className="rounded-full border border-amber-400 px-4 py-2 text-sm text-amber-300" href="#flow">Flow</a>
              <a className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:border-amber-400 hover:text-amber-300" href="#aza">Aza</a>
            </nav>
            <section className="grid gap-4 sm:grid-cols-3">
              <article className="azapay-panel block"><p className="azapay-muted text-sm">Allocated per run</p><p className="mt-3 font-mono text-2xl">₦{outcome.right.overview.total_allocated_per_run}</p></article>
              <article className="azapay-panel block"><p className="azapay-muted text-sm">Total executed</p><p className="mt-3 font-mono text-2xl">₦{outcome.right.overview.total_executed}</p></article>
              <article className="azapay-panel block"><p className="azapay-muted text-sm">Active categories</p><p className="mt-3 text-2xl">{outcome.right.overview.active_categories}</p></article>
            </section>
            <section id="flow" className="mt-10 scroll-mt-8">
              <div className="mb-8 grid gap-7 md:grid-cols-2">
                <div>
                  <h2 className="text-lg font-semibold">Previous run</h2>
                  <p className="azapay-muted mt-1 text-sm">Most recently collected from Flow.</p>
                  {outcome.right.history._tag === "Left" ? <p className="azapay-muted mt-4 text-sm">Run history is temporarily unavailable.</p> : outcome.right.history.right[0] ? <article className="azapay-item-card mt-4"><div className="min-w-0 flex-1"><strong>{outcome.right.history.right[0].category_name}</strong><p>{outcome.right.history.right[0].settled_at ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(outcome.right.history.right[0].settled_at)) : outcome.right.history.right[0].status}</p></div><strong className="font-mono">₦{outcome.right.history.right[0].total_amount}</strong></article> : <p className="azapay-muted mt-4 text-sm">Nothing has run from Flow yet.</p>}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Upcoming</h2>
                  <p className="azapay-muted mt-1 text-sm">Next scheduled pays from Flow.</p>
                  {outcome.right.upcoming._tag === "Left" ? <p className="azapay-muted mt-4 text-sm">Upcoming runs are temporarily unavailable.</p> : outcome.right.upcoming.right.length ? outcome.right.upcoming.right.slice(0, 3).map((run) => <article className="azapay-item-card mt-4" key={`${run.category_id}:${run.next_run_at}`}><div className="min-w-0 flex-1"><p className="azapay-eyebrow">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(run.next_run_at))}</p><strong>{run.category_name}</strong></div><strong className="font-mono">₦{run.amount}</strong></article>) : <p className="azapay-muted mt-4 text-sm">No scheduled pays coming up.</p>}
                </div>
              </div>
              <h2 className="mb-1 text-lg font-semibold">Categories &amp; pays</h2>
              <p className="azapay-muted mb-4 text-sm">Amounts and status supplied by your account.</p>
              <div className="grid gap-3">
                {outcome.right.categories.filter((category) => category.domain_side === "flow").length ? outcome.right.categories.filter((category) => category.domain_side === "flow").map((category) => (
                  <article className="azapay-item-card" key={category.id}>
                    <div className="min-w-0 flex-1"><strong>{category.name}</strong><p className="capitalize">{category.domain_side} · {category.frequency} · {category.status}</p></div>
                    <strong className="font-mono">₦{category.amount_per_run}</strong>
                  </article>
                )) : <p className="azapay-muted py-5">No Flow categories yet.</p>}
              </div>
            </section>
            <section id="aza" className="mt-12 scroll-mt-8">
              <h2 className="mb-1 text-lg font-semibold">Aza categories</h2>
              <p className="azapay-muted mb-4 text-sm">Savings goals and Aza categories in your account.</p>
              <div className="grid gap-3">
                {outcome.right.categories.filter((category) => category.domain_side === "aza").length ? outcome.right.categories.filter((category) => category.domain_side === "aza").map((category) => <article className="azapay-item-card" key={category.id}><div className="min-w-0 flex-1"><strong>{category.name}</strong><p>{category.frequency} · {category.status}</p></div><strong className="font-mono">₦{category.amount_per_run}</strong></article>) : <p className="azapay-muted py-5">No Aza categories yet.</p>}
              </div>
            </section>
            <p className="azapay-muted mt-8 text-sm"><Link className="text-amber-300 hover:underline" href="/flow">Manage Flow instructions →</Link></p>
          </>
        )}
      </div>
    </main>
  )
}
