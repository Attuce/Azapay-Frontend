import { run } from "effection"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { currentUser } from "@/src/features/auth/operations"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { readPageSession } from "@/src/server/session"
import { AppShell } from "@/components/app-shell"

/**
 * Gate the authenticated route group while individual pages authorize their
 * own backend reads and mutations at their actual security boundaries.
 */
export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection()
  const config = loadServerConfig()

  if (!config) return <AppShell>{children}</AppShell>

  const session = await run(function* () {
    yield* ServerConfigContext.set(config)
    return yield* readPageSession()
  })

  if (session.kind === "missing") redirect("/login")

  // The account menu shows the signed-in customer's name; if the read fails the
  // shell renders with a neutral label instead of blocking the page.
  const user =
    session.kind === "authenticated"
      ? await run(function* () {
          yield* ServerConfigContext.set(config)
          yield* AccessTokenContext.set(session.session.access_token)
          const http = yield* createAuthenticatedServerHttp()
          yield* HttpContext.set(http)
          return yield* currentUser()
        })
      : undefined

  const shellUser =
    user?._tag === "Right"
      ? { fullName: user.right.full_name, email: user.right.email }
      : undefined

  return <AppShell user={shellUser}>{children}</AppShell>
}
