import { run } from "effection"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { HttpContext } from "@/src/application/context"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createServerHttp } from "@/src/server/http"
import { readUsableSession } from "@/src/server/session"

/** Rotate an expired access token, then return only to a local application path. */
export async function GET(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get("returnTo")

  const returnTo =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/"

  const config = loadServerConfig()

  if (!config) return NextResponse.redirect(new URL("/login", request.url))

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const http = yield* createServerHttp()
    yield* HttpContext.set(http)

    return yield* readUsableSession()
  })

  if (outcome._tag === "Left" || outcome.right === null) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.redirect(new URL(returnTo, request.url))
}
