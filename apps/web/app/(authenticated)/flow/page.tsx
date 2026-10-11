import Link from "next/link"
import { connection } from "next/server"
import { FlowJourney } from "@/components/flow-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import type { Outcome } from "@/src/application/errors"
import { listCategories } from "@/src/features/dashboard/operations"
import { listFundingConnections } from "@/src/features/funding/operations"
import type { FundingConnection } from "@/src/features/funding/schemas"
import { getFlow, getFlowHistory, getFlowUpcoming } from "@/src/features/flow/operations"
import type { Category, Flow, FlowHistoryView, FlowUpcomingView } from "@/src/features/flow/schemas"
import {
  listFlowAzaOptions,
  listFlowBanks,
  listFlowPays,
  listFlowSaves,
} from "@/src/features/flow/instruction-operations"
import { toFlowPayView, type FlowAzaOption, type FlowBank, type FlowPayView, type FlowSave } from "@/src/features/flow/instruction-schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"

type FlowPageData = {
  readonly flow: Flow
  readonly categories: Category[]
  readonly fundingSources: FundingConnection[]
  readonly upcoming: Outcome<FlowUpcomingView[]>
  readonly history: Outcome<FlowHistoryView[]>
  readonly pays: Outcome<FlowPayView[]>
  readonly saves: Outcome<FlowSave[]>
  readonly azas: Outcome<FlowAzaOption[]>
  readonly banks: Outcome<FlowBank[]>
}

/** Load the Flow domain and categories for this request's authenticated customer. */
function* loadFlowPage(): Operation<Outcome<FlowPageData>> {
  const flow = yield* getFlow()
  if (flow._tag === "Left") return left(flow.left)
  const categories = yield* listCategories()
  if (categories._tag === "Left") return left(categories.left)
  const fundingSources = yield* listFundingConnections()
  if (fundingSources._tag === "Left") return left(fundingSources.left)
  const apiUpcoming = yield* getFlowUpcoming(flow.right.id)
  // The API includes full destination account numbers; omit them before sending data to client components.
  const upcoming: Outcome<FlowUpcomingView[]> = apiUpcoming._tag === "Left"
    ? apiUpcoming
    : right(apiUpcoming.right.map((run): FlowUpcomingView => {
        const destinations = run.destinations.map((destination) => {
          const safeDestination = { ...destination }
          delete safeDestination.account_number
          return safeDestination
        })
        return { ...run, destinations }
      }))
  const apiHistory = yield* getFlowHistory(flow.right.id)
  // History contains full destination account numbers; strip them at the server boundary.
  const history: Outcome<FlowHistoryView[]> = apiHistory._tag === "Left"
    ? apiHistory
    : right(apiHistory.right.map((entry): FlowHistoryView => {
        const children = entry.children.map((child) => {
          const safeChild = { ...child }
          delete safeChild.account_number
          return safeChild
        })
        return { ...entry, children }
      }))
  const apiPays = yield* listFlowPays()
  const flowCategoryIds = new Set(categories.right.filter((category) => category.domain_side === "flow").map((category) => category.id))
  const pays: Outcome<FlowPayView[]> = apiPays._tag === "Left"
    ? apiPays
    : right(apiPays.right.filter((pay) => pay.flow_id === flow.right.id && pay.category_id !== null && flowCategoryIds.has(pay.category_id)).map(toFlowPayView))
  const apiSaves = yield* listFlowSaves()
  const saves: Outcome<FlowSave[]> = apiSaves._tag === "Left"
    ? apiSaves
    : right(apiSaves.right.filter((save) => save.category_id !== null && flowCategoryIds.has(save.category_id)))
  const azas = yield* listFlowAzaOptions()
  const banks = yield* listFlowBanks()
  return right({ flow: flow.right, categories: categories.right, fundingSources: fundingSources.right, upcoming, history, pays, saves, azas, banks })
}

/** Render the Flow instruction management journey. */
export default async function FlowPage() {
  await connection()
  const config = loadServerConfig()
  if (!config) {
    return <main className="min-h-svh bg-[#f3f5f1] p-12 text-[#172d31]"><h1 className="text-3xl font-semibold">Flow unavailable</h1><p className="mt-3">Please try again in a moment.</p></main>
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/flow")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadFlowPage()
  })

  return (
    <main className="min-h-svh bg-[#f3f5f1] px-6 py-10 text-[#172d31]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-[#a54d2f] hover:underline">← Account</Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">Flow instructions</h1>
        <p className="mt-2 max-w-2xl text-[#506665]">{outcome._tag === "Right" ? outcome.right.flow.description ?? "Manage your spending and saving schedules." : "Manage your spending and saving schedules."}</p>
        {outcome._tag === "Left" ? (
          <section className="mt-8 rounded-2xl border border-[#cbd6d3] bg-white p-8"><h2 className="text-2xl font-semibold">Flow unavailable</h2><p className="mt-2 text-[#506665]">We couldn’t load your instructions. Refresh and try again.</p></section>
        ) : (
          <div className="mt-8"><FlowJourney flow={outcome.right.flow} categories={outcome.right.categories} fundingSources={outcome.right.fundingSources} upcoming={outcome.right.upcoming} history={outcome.right.history} pays={outcome.right.pays} saves={outcome.right.saves} azas={outcome.right.azas} banks={outcome.right.banks} /></div>
        )}
      </div>
    </main>
  )
}
