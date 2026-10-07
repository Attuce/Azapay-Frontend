"use client"

import Link from "next/link"
import { useActionState } from "react"
import { loginAction, registerAction } from "@/app/auth/actions"

/** Shared sign-in and registration form; credentials go to server actions. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register"

  const [state, action, pending] = useActionState(
    isRegister ? registerAction : loginAction,
    null
  )

  return (
    <main className="grid min-h-svh bg-[#f3f5f1] text-[#172d31] lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.82fr)]">
      <section className="relative hidden overflow-hidden bg-[#193a3d] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="text-2xl font-bold tracking-tight">
          aza<span className="text-[#e69a72]">pay</span>
        </span>

        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-sm font-medium tracking-[0.2em] text-[#a9d3c9] uppercase">
            Money, with direction
          </p>
          <h1 className="text-5xl leading-[1.1] font-semibold tracking-tight">
            Make room for what matters next.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#c7d9d3]">
            Set up your account to manage spending and saving from one place.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-[#a9d3c9]">
          <span className="h-2 w-2 rounded-full bg-[#e69a72]" /> AzaPay
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 -right-40 h-[620px] w-[620px] rounded-full border-[90px] border-[#275155] opacity-80"
        />
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <span className="mb-14 block text-2xl font-bold tracking-tight lg:hidden">
            aza<span className="text-[#ce6944]">pay</span>
          </span>

          <p className="text-sm font-semibold tracking-[0.16em] text-[#a54d2f] uppercase">
            {isRegister ? "New account" : "Welcome back"}
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            {isRegister ? "Create your account" : "Sign in to AzaPay"}
          </h2>
          <p className="mt-3 text-[#506665]">
            {isRegister ? "Already have an account?" : "New to AzaPay?"}{" "}
            <Link
              className="font-semibold text-[#a54d2f] underline-offset-4 hover:underline"
              href={isRegister ? "/login" : "/signup"}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <form action={action} className="mt-10 space-y-5">
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
                  className="h-12 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"
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
                className="h-12 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"
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
                required
                minLength={isRegister ? 8 : 1}
                maxLength={isRegister ? 128 : undefined}
                className="h-12 w-full rounded-xl border border-[#9eafab] bg-white px-4 outline-none focus:border-[#193a3d] focus:ring-2 focus:ring-[#8ab5a8]"
              />
              {isRegister && (
                <p className="mt-2 text-sm text-[#506665]">
                  Use at least 8 characters.
                </p>
              )}
            </div>

            {state?.message && (
              <p
                role="alert"
                className="rounded-xl border border-[#d6a392] bg-[#fff1eb] px-4 py-3 text-sm text-[#8c3c24]"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-xl bg-[#193a3d] px-5 font-semibold text-white transition-colors hover:bg-[#2c5557] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#193a3d] disabled:cursor-wait disabled:opacity-60"
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
