import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { loadServerConfig } from "@/src/server/config"

const clerkProxy = clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname
  const protectedRoute =
    pathname === "/" ||
    ["/flow", "/azas", "/analytics", "/funding", "/settings"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )

  if (protectedRoute) {
    const returnTo = `${pathname}${request.nextUrl.search}`
    const signInUrl = new URL(
      `/login?redirect_url=${encodeURIComponent(returnTo)}`,
      request.url
    ).toString()
    await auth.protect({ unauthenticatedUrl: signInUrl })
  }
})

/** Protect customer pages when Clerk is configured; API actions also authorize independently. */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const config = loadServerConfig()
  if (config?.e2eTestMode || !config?.clerkPublishableKey || !config.clerkSecretKey) {
    return NextResponse.next()
  }

  return clerkProxy(request, event)
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
}
