import Link from "next/link"
import { connection } from "next/server"
import { run } from "effection"
import { AzaCollectionForms } from "@/components/aza-forms"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { listAzas } from "@/src/features/aza/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"

export const metadata = { title: "Azas | AzaPay" }

/** Render the authenticated Aza list and create/accept journey. */
export default async function AzasPage() {
  await connection()
  const config = loadServerConfig()
  if (!config) return <main id="main-content" tabIndex={-1} className="p-10"><h1 className="text-3xl font-semibold">Azas unavailable</h1><p className="mt-3">AzaPay is temporarily unavailable.</p></main>
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
  return <main id="main-content" tabIndex={-1} className="min-h-svh bg-[#f3f5f1] px-6 py-10 text-[#172d31]"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-semibold text-[#a54d2f] hover:underline">← Account</Link><h1 className="mt-5 text-4xl font-semibold tracking-tight">Azas</h1><p className="mt-2 max-w-2xl text-[#506665]">Create and manage savings spaces, invite members, and review backend-provided contribution and withdrawal state.</p>
    <section className="mt-8 grid gap-4 sm:grid-cols-2">{result?.length ? result.map(({ aza, isOwner }) => <Link key={aza.id} href={`/azas/${aza.id}`} className="rounded-2xl border border-[#cbd6d3] bg-white p-6 hover:border-[#819491]"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold">{aza.name}</h2><span className="text-xs capitalize text-[#506665]">{isOwner ? "Owner" : "Member"}</span></div><p className="mt-2 text-sm capitalize text-[#506665]">{aza.visibility} · {aza.mode} · {aza.status}</p><p className="mt-4 font-mono">{aza.display_balance === null ? "Balance not provided" : `₦${aza.display_balance}`}</p></Link>) : <p className="rounded-xl bg-white p-5 text-sm text-[#506665]">No Azas are available, or the list could not be loaded.</p>}</section>
    <div className="mt-8"><AzaCollectionForms /></div></div></main>
}
