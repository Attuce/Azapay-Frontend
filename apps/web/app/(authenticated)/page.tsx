import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import { currentUser } from "@/src/features/auth/operations"
import type { User } from "@/src/features/auth/schemas"
import { listActivity, listCategories } from "@/src/features/dashboard/operations"
import type { Activity, Category } from "@/src/features/dashboard/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { AddTrigger } from "@/components/app-shell"

export const metadata = { title: "Account | AzaPay" }

type DashboardData = {
  readonly user: User
  readonly categories: Category[]
  readonly activity: Activity
}

/** Read the Stage 3 dashboard without deriving any financial state locally. */
function* loadDashboard(): Operation<Outcome<DashboardData>> {
  const user = yield* currentUser()
  if (user._tag === "Left") return left(user.left)

  const categories = yield* listCategories()
  if (categories._tag === "Left") return left(categories.left)

  const activity = yield* listActivity()
  if (activity._tag === "Left") return left(activity.left)

  return right({
    user: user.right,
    categories: categories.right,
    activity: activity.right,
  })
}

/** Render current account data from the API for the request's session. */
export default async function HomePage() {
  // The cookie read inside Effection is not visible to Next's static analysis.
  await connection()
  const config = loadServerConfig()

  if (!config) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-svh p-12">
        <h1 className="text-3xl font-semibold">Account unavailable</h1>
        <p className="mt-3">Please try again later.</p>
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

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page azapay-home min-h-svh px-6 py-10">
      <div className="azapay-page-inner">
        {outcome._tag === "Left" ? (
          <section className="azapay-panel max-w-xl rounded-2xl p-8">
            <h1 className="text-3xl font-semibold">Account unavailable</h1>
            <p className="mt-3 text-[#4b6465]">
              We couldn’t load your account right now. Refresh the page to try
              again.
            </p>
          </section>
        ) : (
            <>
              <div className="azapay-welcome">
                <p className="azapay-eyebrow">WELCOME</p>
                <h1 className="azapay-display-title">Welcome, {outcome.right.user.full_name.split(" ")[0]}.</h1>
                <p className="azapay-muted">Give every naira that comes into your life a destination</p>
                <AddTrigger className="azapay-add-button azapay-home-add" />
                <p className="azapay-muted">{outcome.right.categories.length ? "Here’s everything set to run automatically." : "You’re new here — let’s set up your first pay."}</p>
              </div>

              {outcome.right.categories.filter((category) => category.domain_side === "flow").length === 0 ? (
                <section className="azapay-example-card" aria-label="Example pay setup">
                  <span className="azapay-example-badge">EXAMPLE</span>
                  <div className="azapay-example-row"><span className="azapay-example-icon">⌂</span><div><strong>A regular contribution</strong><p>Flow category · scheduled instruction</p></div></div>
                  <p className="azapay-muted">Choose a purpose, amount, and schedule. AzaPay will show the readiness reported by your account.</p>
                </section>
              ) : (
                <section className="azapay-list-section">
                  <h2>Pays and categories</h2>
                  <div className="azapay-item-list">{outcome.right.categories.filter((category) => category.domain_side === "flow").map((category) => (
                    <article className="azapay-item-card" key={category.id}>
                      <span className="azapay-example-icon">✦</span>
                      <div className="min-w-0 flex-1"><strong>{category.name}</strong><p>{category.frequency} · {category.status}</p></div>
                      <strong className="font-mono">₦{category.amount_per_run}</strong>
                    </article>
                  ))}</div>
                </section>
              )}
              {!outcome.right.activity.rows.length ? <p className="azapay-quote">“The money that has somewhere to go rarely goes missing.”</p> : <section className="azapay-list-section"><h2>Recent activity</h2><div className="azapay-item-list">{outcome.right.activity.rows.slice(0, 4).map((event) => <article className="azapay-item-card" key={event.id}><div className="min-w-0"><strong>{event.action.replaceAll("_", " ")}</strong><p>{event.entity_type} · {event.created_at}</p></div></article>)}</div></section>}
            </>
        )}
      </div>
    </main>
  )
}
