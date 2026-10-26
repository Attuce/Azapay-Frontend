import { run } from "effection"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
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

  return <AppShell>{children}</AppShell>
}
