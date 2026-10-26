"use client"

import Link from "next/link"
import { useActionState } from "react"
import { loginAction, registerAction } from "@/app/auth/actions"

/** Shared sign-in and registration form; credentials go to server actions. */
export function AuthForm({ mode, notice }: { mode: "login" | "register"; readonly notice?: string }) {
  const isRegister = mode === "register"

  const [state, action, pending] = useActionState(
    isRegister ? registerAction : loginAction,
    null
  )

  return (
    <main id="main-content" tabIndex={-1} className="azapay-auth-page min-h-svh px-5 py-10">
      <section className="azapay-auth-card">
        <Link href="/login" className="azapay-wordmark" aria-label="Azapay">Azapay</Link>
        <div className="mt-9">
          <p className="azapay-eyebrow">
            {isRegister ? "New account" : "Welcome back"}
          </p>
          <h1 className="azapay-display-title mt-2 text-3xl">
            {isRegister ? "Create your account" : "Sign in to AzaPay"}
          </h1>
          <p className="azapay-muted mt-3">
            {isRegister ? "Already have an account?" : "New to AzaPay?"}{" "}
            <a
              className="font-semibold text-amber-300 underline-offset-4 hover:underline"
              href={isRegister ? "/login" : "/signup"}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </a>
          </p>
          {notice && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{notice}</p>}

          <form action={action} className="mt-8 space-y-5">
            {isRegister && (
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  autoComplete="name"
                  required
                  minLength={1}
                  maxLength={200}
                  className="azapay-auth-input"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="azapay-auth-input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                aria-describedby={isRegister ? "password-requirements" : undefined}
                required
                minLength={isRegister ? 8 : 1}
                maxLength={isRegister ? 128 : undefined}
                className="azapay-auth-input"
              />
              {isRegister && (
                <p id="password-requirements" className="mt-2 text-sm text-[#506665]">
                  Use at least 8 characters.
                </p>
              )}
            </div>

            {state?.message && (
              <p
                id="auth-error"
                role="alert"
                className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="azapay-add-button w-full disabled:cursor-wait disabled:opacity-60"
            >
              {pending
                ? "Please wait…"
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
