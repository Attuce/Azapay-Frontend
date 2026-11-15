import Link from "next/link"
import { Suspense } from "react"
import { SignIn, SignUp } from "@clerk/nextjs"

/** Keep AzaPay's auth shell while Clerk owns credentials and recovery flows. */
export function AuthForm({
  mode,
  configured,
  notice,
  redirectUrl,
}: {
  readonly mode: "login" | "register"
  readonly configured: boolean
  readonly notice?: string
  readonly redirectUrl?: string
}) {
  const isRegister = mode === "register"
  const requestedUrl = redirectUrl ? new URL(redirectUrl, "https://azapay.invalid") : null
  const safeRedirectUrl = requestedUrl?.origin === "https://azapay.invalid"
    ? `${requestedUrl.pathname}${requestedUrl.search}${requestedUrl.hash}`
    : "/"

  return (
    <main id="main-content" tabIndex={-1} className="azapay-auth-page min-h-svh px-5 py-10">
      <section className="azapay-auth-card">
        <Link href="/login" className="azapay-wordmark" aria-label="Azapay">Azapay</Link>
        <div className="mt-9">
          <p className="azapay-eyebrow">{isRegister ? "New account" : "Welcome back"}</p>
          <h1 className="azapay-display-title mt-2 text-3xl">
            {isRegister ? "Create your account" : "Sign in to AzaPay"}
          </h1>
          <p className="azapay-muted mt-3">
            {isRegister ? "Already have an account?" : "New to AzaPay?"}{" "}
            <Link
              className="font-semibold text-amber-300 underline-offset-4 hover:underline"
              href={isRegister ? "/login" : "/signup"}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
          {notice ? <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{notice}</p> : null}

          <div className="mt-8">
            {configured ? (
              isRegister ? (
                <Suspense>
                  <SignUp
                  path="/signup"
                  routing="path"
                  signInUrl="/login"
                  fallbackRedirectUrl="/"
                  forceRedirectUrl="/"
                  />
                </Suspense>
              ) : (
                <Suspense>
                  <SignIn
                  path="/login"
                  routing="path"
                  signUpUrl="/signup"
                  fallbackRedirectUrl={safeRedirectUrl}
                  forceRedirectUrl={safeRedirectUrl}
                  />
                </Suspense>
              )
            ) : (
              <p role="status" className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm">
                Sign-in is not configured yet. Add the Clerk publishable and secret keys to the server environment.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
