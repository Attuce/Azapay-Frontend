import Link from "next/link"
import { connection } from "next/server"
import { randomUUID } from "node:crypto"
import { run } from "effection"
import { left, right } from "fp-ts/Either"
import { ArrowLeft } from "lucide-react"
import { AzaDetailJourney } from "@/components/aza-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { getAza, getAzaPosition, listAzaContributions, listAzaInvites, listAzaMembers, listAzaWithdrawals } from "@/src/features/aza/operations"
import { toWithdrawalView } from "@/src/features/aza/schemas"
import { listBanks, listFundingConnections } from "@/src/features/funding/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"

export const metadata = { title: "Aza details | AzaPay" }

/** Load one Aza and its member-facing activity through the request Effection scope. */
export default async function AzaDetailPage({ params }: { readonly params: Promise<{ readonly azaId: string }> }) {
  await connection()
  const { azaId } = await params
  const config = loadServerConfig()
  if (!config) return <main id="main-content" tabIndex={-1} className="p-10"><h1 className="azapay-display-title">Aza unavailable</h1><p className="azapay-muted mt-3">AzaPay is temporarily unavailable.</p></main>
  const result = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession(`/azas/${azaId}`)
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    const user = yield* currentUser()
    const aza = yield* getAza(azaId)
    if (user._tag === "Left" || aza._tag === "Left") return left("unavailable" as const)
    const contributions = yield* listAzaContributions(azaId)
    const invites = yield* listAzaInvites(azaId)
    const members = yield* listAzaMembers(azaId)
    const position = yield* getAzaPosition(azaId)
    const withdrawals = yield* listAzaWithdrawals(azaId)
    const fundingSources = yield* listFundingConnections()
    const banks = yield* listBanks()
    if (contributions._tag === "Left" || invites._tag === "Left" || members._tag === "Left" || position._tag === "Left" || withdrawals._tag === "Left" || fundingSources._tag === "Left" || banks._tag === "Left") return left("unavailable" as const)
    return right({ aza: aza.right, isOwner: aza.right.owner_user_id === user.right.id, contributions: contributions.right, invites: invites.right, members: members.right, position: position.right, withdrawals: withdrawals.right.map(toWithdrawalView), fundingSources: fundingSources.right, banks: banks.right })
  })
  return <main id="main-content" tabIndex={-1} className="azapay-page"><div className="azapay-page-inner"><Link href="/azas" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--bl)] hover:underline"><ArrowLeft size={16} aria-hidden="true" /> All Azas</Link>{result._tag === "Left" ? <section className="azapay-panel mt-6"><h1 className="text-2xl font-extrabold text-[var(--ink)]">Aza unavailable</h1><p className="azapay-muted mt-2">We couldn’t load this Aza and its activity. Refresh to try again.</p></section> : <><h1 className="azapay-display-title mt-4">{result.right.aza.name}</h1><p className="mt-2 text-[var(--mu)]">{result.right.aza.description ?? result.right.aza.purpose ?? "Manage this Aza."}</p><AzaDetailJourney {...result.right} requestKey={randomUUID()} releaseKey={randomUUID()} /></>}</div></main>
}
