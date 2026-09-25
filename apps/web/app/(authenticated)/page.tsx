import { run } from "effection"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { logoutAction } from "../auth/actions"
import { HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import Link from "next/link"

/** Render current account data from the API for the request's session. */
export default async function HomePage() {
  // The cookie read inside Effection is not visible to Next's static analysis.
  await connection()
  const config = loadServerConfig()

  if (!config) {
    return (
      <main className="min-h-svh bg-[#f3f5f1] p-12 text-[#172d31]">
        <h1 className="text-3xl font-semibold">Account unavailable</h1>
        <p className="mt-3">Please try again later.</p>
      </main>
    )
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const http = yield* createServerHttp()
    yield* HttpContext.set(http)

    const session = yield* requirePageSession("/")
    return yield* currentUser(session.access_token)
  })

  if (
    outcome._tag === "Left" &&
    outcome.left.kind === "http-status" &&
    outcome.left.status === 401
  ) {
    redirect("/login")
  }

  return (
    <main className="min-h-svh bg-[#f3f5f1] text-[#172d31]">
      <header className="border-b border-[#cbd6d3] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            aza<span className="text-[#ce6944]">pay</span>
          </span>
          <form action={logoutAction}>
            <div className="flex items-center gap-3">
              <Link
                className="text-sm font-semibold hover:underline"
                href="/settings"
              >
                Settings
              </Link>
              <button className="rounded-full border border-[#819491] px-4 py-2 text-sm font-medium hover:bg-[#eff4f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#172d31]">
                Sign out
              </button>
            </div>
          </form>
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
              Welcome, {outcome.right.full_name}
            </h1>

            <p className="mt-3 max-w-2xl text-[#4b6465]">
              Your profile details come from AzaPay. Spending and savings tools
              will appear here as they are implemented.
            </p>

            <section className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <h2 className="text-sm font-semibold tracking-wide text-[#56716e] uppercase">
                  Email
                </h2>
                <p className="mt-3 text-lg font-medium break-all">
                  {outcome.right.email}
                </p>
              </div>
              <div className="rounded-2xl border border-[#cbd6d3] bg-white p-6">
                <h2 className="text-sm font-semibold tracking-wide text-[#56716e] uppercase">
                  Account status
                </h2>
                <p className="mt-3 text-lg font-medium capitalize">
                  {outcome.right.status.replaceAll("_", " ")}
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
