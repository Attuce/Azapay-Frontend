import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { logoutAction } from "../auth/actions"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import { currentUser } from "@/src/features/auth/operations"
import type { User } from "@/src/features/auth/schemas"
import {
  getOverview,
  listActivity,
  listCategories,
} from "@/src/features/dashboard/operations"
import { getFlow } from "@/src/features/flow/operations"
import type {
  Activity,
  Category,
  Overview,
} from "@/src/features/dashboard/schemas"
import type { Flow } from "@/src/features/flow/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import Link from "next/link"

export const metadata = { title: "Account | AzaPay" }

type DashboardData = {
  readonly user: User
  readonly overview: Overview
  readonly flow: Flow
  readonly categories: Category[]
  readonly activity: Activity
}

/** Read the Stage 3 dashboard without deriving any financial state locally. */
function* loadDashboard(): Operation<Outcome<DashboardData>> {
  const user = yield* currentUser()
  if (user._tag === "Left") return left(user.left)

  const overview = yield* getOverview()
  if (overview._tag === "Left") return left(overview.left)

  const flow = yield* getFlow()
  if (flow._tag === "Left") return left(flow.left)

  const categories = yield* listCategories()
  if (categories._tag === "Left") return left(categories.left)

  const activity = yield* listActivity()
  if (activity._tag === "Left") return left(activity.left)

  return right({
    user: user.right,
    overview: overview.right,
    flow: flow.right,
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
      <main id="main-content" tabIndex={-1} className="min-h-svh bg-[#f3f5f1] p-12 text-[#172d31]">
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
    <main id="main-content" tabIndex={-1} className="min-h-svh bg-[#f3f5f1] text-[#172d31]">
      <header className="border-b border-[#cbd6d3] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <span className="text-xl font-bold tracking-tight">
            aza<span className="text-[#ce6944]">pay</span>
          </span>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <nav aria-label="Account navigation" className="flex flex-wrap items-center gap-3">
              <Link
                className="text-sm font-semibold hover:underline"
                href="/azas"
              >
                Azas
              </Link>
              <Link
                className="text-sm font-semibold hover:underline"
                href="/flow"
              >
                Flow
              </Link>
              <Link
                className="text-sm font-semibold hover:underline"
                href="/funding"
              >
                Funding
              </Link>
              <Link
                className="text-sm font-semibold hover:underline"
                href="/settings"
              >
                Settings
              </Link>
            </nav>
            <form action={logoutAction}>
              <button className="rounded-full border border-[#819491] px-4 py-2 text-sm font-medium hover:bg-[#eff4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#172d31]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {outcome._tag === "Left" ? (
          <section className="max-w-xl rounded-2xl border border-[#cbd6d3] bg-white p-8">
            <h1 className="text-3xl font-semibold">Account unavailable</h1>
            <p className="mt-3 text-[#4b6465]">
              We couldn’t load your account right now. Refresh the page to try
              again.
            </p>
          </section>
        ) : (
          <>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#a54d2f] uppercase">
              Your account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Welcome, {outcome.right.user.full_name}
            </h1>

            <p className="mt-3 max-w-2xl text-[#4b6465]">
              This is the latest backend-provided view of your spending setup.
            </p>

            <section className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <h2 className="text-sm font-semibold tracking-wide text-[#56716e] uppercase">
                  Allocated per run
                </h2>
                <p className="mt-3 font-mono text-lg font-medium tabular-nums">
                  ₦{outcome.right.overview.total_allocated_per_run}
                </p>
              </div>
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <h2 className="text-sm font-semibold tracking-wide text-[#56716e] uppercase">
                  Total executed
                </h2>
                <p className="mt-3 font-mono text-lg font-medium tabular-nums">
                  ₦{outcome.right.overview.total_executed}
                </p>
              </div>
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <h2 className="text-sm font-semibold tracking-wide text-[#56716e] uppercase">
                  Active categories
                </h2>
                <p className="mt-3 text-lg font-medium">
                  {outcome.right.overview.active_categories}
                </p>
              </div>
            </section>

            <section className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.14em] text-[#a54d2f] uppercase">
                      Flow
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {outcome.right.flow.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#eff4f2] px-3 py-1 text-sm font-medium capitalize">
                    {outcome.right.flow.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#506665]">
                  {outcome.right.flow.description ?? "Your spending domain."}
                </p>
                <div className="mt-6 divide-y divide-[#e2e8e5]">
                  {outcome.right.categories.filter(
                    (category) => category.domain_side === "flow"
                  ).length === 0 ? (
                    <p className="py-4 text-sm text-[#506665]">
                      No Flow categories yet.
                    </p>
                  ) : (
                    outcome.right.categories
                      .filter((category) => category.domain_side === "flow")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-4 py-4"
                        >
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="mt-1 text-sm text-[#506665] capitalize">
                              {category.frequency} · {category.status}
                            </p>
                          </div>
                          <p className="font-mono text-sm font-semibold tabular-nums">
                            ₦{category.amount_per_run}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <p className="text-sm font-semibold tracking-[0.14em] text-[#a54d2f] uppercase">
                  Activity
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Latest events</h2>
                <div className="mt-5 space-y-4">
                  {outcome.right.activity.rows.length === 0 ? (
                    <p className="text-sm text-[#506665]">No activity yet.</p>
                  ) : (
                    outcome.right.activity.rows.map((event) => (
                      <div
                        key={event.id}
                        className="border-l-2 border-[#cbd6d3] pl-3"
                      >
                        <p className="text-sm font-medium">
                          {event.action.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-[#506665]">
                          {event.entity_type} · {event.created_at}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
