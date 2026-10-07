import Link from "next/link"
import { connection } from "next/server"
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
export default async function FundingPage() {
  await connection()
  const config = loadServerConfig()

  if (!config) {
    return (
      <main className="min-h-svh bg-[#f3f5f1] p-12 text-[#172d31]">
        <h1 className="text-3xl font-semibold">Funding unavailable</h1>
        <p className="mt-3">Please try again in a moment.</p>
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
    <main className="min-h-svh bg-[#f3f5f1] px-6 py-10 text-[#172d31]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#a54d2f] hover:underline"
        >
          ← Account
        </Link>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Funding sources
        </h1>
        <p className="mt-2 max-w-2xl text-[#506665]">
          Connect a bank account or card, verify it with the provider, and keep your
          preferred source ready for future spending rules.
        </p>

        {outcome._tag === "Left" ? (
          <section className="mt-8 rounded-2xl border border-[#cbd6d3] bg-white p-8">
            <h2 className="text-2xl font-semibold">Funding unavailable</h2>
            <p className="mt-2 text-[#506665]">
              We couldn’t load your linked funding sources right now. Please refresh
              and try again.
            </p>
          </section>
        ) : (
          <div className="mt-8">
            <FundingJourney
              banks={outcome.right.banks}
              connections={outcome.right.connections}
            />
          </div>
        )}
      </div>
    </main>
  )
}
