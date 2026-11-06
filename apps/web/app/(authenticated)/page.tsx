import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Coins, Receipt, Sparkles } from "lucide-react"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import { currentUser } from "@/src/features/auth/operations"
import type { User } from "@/src/features/auth/schemas"
import { getOverview, listActivity, listCategories } from "@/src/features/dashboard/operations"
import type { Activity, Category, Overview } from "@/src/features/dashboard/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { BalanceHero } from "@/components/balance-hero"
import { AddTrigger } from "@/components/app-shell"

export const metadata = { title: "Account | AzaPay" }

type DashboardData = {
  readonly user: User
  readonly categories: Category[]
  readonly activity: Activity
  readonly overview: Outcome<Overview>
}

/** Read the Stage 3 dashboard without deriving any financial state locally. */
function* loadDashboard(): Operation<Outcome<DashboardData>> {
  const user = yield* currentUser()
  if (user._tag === "Left") return left(user.left)

  const categories = yield* listCategories()
  if (categories._tag === "Left") return left(categories.left)

  const activity = yield* listActivity()
  if (activity._tag === "Left") return left(activity.left)

  const overview = yield* getOverview()

  return right({
    user: user.right,
    categories: categories.right,
    activity: activity.right,
    overview,
  })
}

/** Render current account data from the API for the request's session. */
export default async function HomePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly q?: string }>
}) {
  // The cookie read inside Effection is not visible to Next's static analysis.
  await connection()
  const config = loadServerConfig()
  const { q } = await searchParams
  const query = (q ?? "").trim().toLowerCase()

  if (!config) {
    return (
      <main id="main-content" tabIndex={-1} className="p-8">
        <h1 className="azapay-display-title">Account unavailable</h1>
        <p className="azapay-muted mt-3">Please try again later.</p>
      </main>
    )
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadDashboard()
  })

  if (
    outcome._tag === "Left" &&
    outcome.left.kind === "http-status" &&
    outcome.left.status === 401
  ) {
    redirect("/login")
  }

  if (outcome._tag === "Left") {
    return (
      <main id="main-content" tabIndex={-1} className="azapay-page p-8">
        <h1 className="azapay-display-title">Account unavailable</h1>
        <p className="azapay-muted mt-3">
          We couldn’t load your account right now. Refresh the page to try again.
        </p>
      </main>
    )
  }

  const { user, categories, activity, overview } = outcome.right
  const firstName = user.full_name.split(" ")[0] ?? user.full_name
  const flowCategories = categories.filter((category) => category.domain_side === "flow")
  const visibleCategories = flowCategories.filter((category) =>
    !query || category.name.toLowerCase().includes(query)
  )
  const visibleActivity = activity.rows.filter((event) =>
    !query ||
    event.action.replaceAll("_", " ").toLowerCase().includes(query) ||
    event.entity_type.toLowerCase().includes(query)
  )
  const isNew = flowCategories.length === 0

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page">
      <div className="azapay-page-inner">
        <header className="mb-6">
          <h1 className="azapay-display-title">Hello, {firstName}</h1>
          <p className="azapay-muted mt-2">Money in, split automatically, sent exactly where you tell it to go.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          {overview._tag === "Right" ? (
            <BalanceHero
              saved={overview.right.total_saved}
              allocatedPerRun={overview.right.total_allocated_per_run}
              executed={overview.right.total_executed}
            />
          ) : (
            <section className="azapay-hero" aria-label="Get started">
              <div className="azapay-hero-top"><span>Your Flow</span></div>
              <p className="azapay-hero-amount text-3xl">Set it once, then let it run</p>
              <p className="azapay-hero-caption">Account totals are temporarily unavailable. Your categories and activity below are up to date.</p>
              <AddTrigger className="azapay-hero-action" />
            </section>
          )}

          <section className="grid content-start gap-4" aria-label="Account snapshot">
            <div className="azapay-stat">
              <small>Active categories</small>
              <b>{overview._tag === "Right" ? overview.right.active_categories : flowCategories.length}</b>
            </div>
            <div className="azapay-stat">
              <small>Total executed</small>
              <b>{overview._tag === "Right" ? `₦${overview.right.total_executed}` : "Temporarily unavailable"}</b>
            </div>
            <div className="azapay-stat">
              <small>Total returns</small>
              <b>{overview._tag === "Right" ? `₦${overview.right.total_returns}` : "Temporarily unavailable"}</b>
            </div>
          </section>
        </div>

        {isNew ? (
          <section className="azapay-example-card" aria-label="Example pay setup">
            <span className="azapay-example-badge">EXAMPLE</span>
            <div className="azapay-example-row">
              <span className="azapay-icon-badge"><Sparkles size={20} aria-hidden="true" /></span>
              <div><strong>A regular contribution</strong><p className="azapay-muted text-sm">Flow category · scheduled instruction</p></div>
            </div>
            <p className="azapay-muted text-sm">Choose a purpose, amount, and schedule. AzaPay will show the readiness reported by your account.</p>
            <AddTrigger className="btn-primary mt-4" />
          </section>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="azapay-list-section !mt-0" aria-label="Flow categories">
            <h2>Pays and categories</h2>
            {visibleCategories.length ? (
              <div className="azapay-item-list">
                {visibleCategories.map((category) => (
                  <article className="azapay-item-card" key={category.id}>
                    <span className="azapay-icon-badge"><Coins size={20} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1"><strong>{category.name}</strong><p className="text-sm capitalize">{category.frequency} · {category.status}</p></div>
                    <strong className="tabular-nums">₦{category.amount_per_run}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className="azapay-muted">{query ? <>Nothing matches “{query}”.</> : "No Flow categories yet."}</p>
            )}
          </section>

          <section className="azapay-list-section !mt-0" aria-label="Recent activity">
            <h2>Recent activity</h2>
            {visibleActivity.length ? (
              <div className="azapay-item-list">
                {visibleActivity.slice(0, 8).map((event) => (
                  <article className="azapay-item-card" key={event.id}>
                    <span className="azapay-icon-badge azapay-icon-badge-out"><Receipt size={20} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <strong className="capitalize">{event.action.replaceAll("_", " ")}</strong>
                      <p className="text-sm">{event.entity_type} · {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(event.created_at))}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="azapay-muted">{query ? <>Nothing matches “{query}”.</> : "Nothing has happened yet. Your activity will appear here."}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
