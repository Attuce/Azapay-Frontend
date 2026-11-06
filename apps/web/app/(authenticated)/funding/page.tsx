import Link from "next/link"
import { connection } from "next/server"
import { ArrowLeft } from "lucide-react"
import { FundingJourney } from "@/components/funding-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { Outcome } from "@/src/application/errors"
import { listBanks, listFundingConnections } from "@/src/features/funding/operations"
import type { Bank, FundingConnection } from "@/src/features/funding/schemas"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { run, type Operation } from "effection"
import { left, right } from "fp-ts/Either"

export const metadata = { title: "Funding | AzaPay" }

type FundingPageData = {
  readonly banks: Bank[]
  readonly connections: FundingConnection[]
}

/** Read the bank list and the customer's current connected funding sources. */
function* loadFundingPage(): Operation<Outcome<FundingPageData>> {
  const banks = yield* listBanks()
  if (banks._tag === "Left") return left(banks.left)

  const connections = yield* listFundingConnections()
  if (connections._tag === "Left") return left(connections.left)

  return right({ banks: banks.right, connections: connections.right })
}

/** Render the funding-source onboarding and verification journey. */
export default async function FundingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly q?: string }>
}) {
  await connection()
  const config = loadServerConfig()
  const { q } = await searchParams
  const query = (q ?? "").trim()

  if (!config) {
    return (
      <main id="main-content" tabIndex={-1} className="azapay-page p-8">
        <h1 className="azapay-display-title">Funding unavailable</h1>
        <p className="azapay-muted mt-3">Please try again in a moment.</p>
      </main>
    )
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/funding")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* loadFundingPage()
  })

  return (
    <main id="main-content" tabIndex={-1} className="azapay-page">
      <div className="azapay-page-inner">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--bl)] hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Account
        </Link>

        <h1 className="azapay-display-title mt-4">
          Funding sources
        </h1>
        <p className="azapay-muted mt-2 max-w-2xl">
          Connect a bank account or card, verify it with the provider, and keep your
          preferred source ready for future spending rules.
        </p>

        {outcome._tag === "Left" ? (
          <section className="azapay-panel mt-8">
            <h2 className="text-2xl font-extrabold text-[var(--ink)]">Funding unavailable</h2>
            <p className="azapay-muted mt-2">
              We couldn’t load your linked funding sources right now. Please refresh
              and try again.
            </p>
          </section>
        ) : (
          <div className="mt-8">
            <FundingJourney
              banks={outcome.right.banks}
              connections={outcome.right.connections}
              query={query}
            />
          </div>
        )}
      </div>
    </main>
  )
}
