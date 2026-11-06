"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { loginAction, registerAction } from "@/app/auth/actions"
import { LogoMark } from "@/components/logo"

/**
 * Shared sign-in and registration form; credentials go to server actions.
 * Layout mirrors the supplied AzaPay redesign (split screen); only the
 * authentication the backend actually supports is rendered.
 */
export function AuthForm({ mode, notice }: { mode: "login" | "register"; readonly notice?: string }) {
  const isRegister = mode === "register"
  const [showPassword, setShowPassword] = useState(false)

  const [state, action, pending] = useActionState(
    isRegister ? registerAction : loginAction,
    null
  )

  return (
    <main id="main-content" tabIndex={-1} className="azapay-auth-page">
      <div className="azapay-auth-form-col">
        <Link href="/login" className="azapay-auth-logo" aria-label="AzaPay">
          <LogoMark size={56} />
        </Link>

        <h1 className="azapay-auth-title">
          {isRegister ? "Create your account" : "Sign in to AzaPay"}
        </h1>
        <p className="azapay-auth-tag">Transform your money habits</p>

        <p className="azapay-auth-switch">
          {isRegister ? "Already have an account?" : "New to AzaPay?"}{" "}
          <a href={isRegister ? "/login" : "/signup"}>
            {isRegister ? "Sign in" : "Create an account"}
          </a>
        </p>

        {notice && <p role="status" className="azapay-auth-notice">{notice}</p>}

        <form action={action} className="azapay-auth-form">
          {isRegister && (
            <label className="azapay-field-label !gap-2" htmlFor="full_name">
              Full name
              <input
                id="full_name"
                name="full_name"
                autoComplete="name"
                required
                minLength={1}
                maxLength={200}
                className="field"
                placeholder="Ada Lovelace"
              />
            </label>
          )}

          <label className="azapay-field-label !gap-2" htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
            />
          </label>

          <label className="azapay-field-label !gap-2" htmlFor="password">Password</label>
          <span className="azapay-password-row">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              aria-describedby={isRegister ? "password-requirements" : undefined}
              required
              minLength={isRegister ? 8 : 1}
              maxLength={isRegister ? 128 : undefined}
              className="field pr-16"
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
            />
            <button
              type="button"
              className="azapay-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
          {isRegister && (
            <p id="password-requirements" className="azapay-muted -mt-1 text-sm">
              Use at least 8 characters.
            </p>
          )}

          {state?.message && (
            <p
              id="auth-error"
              role="alert"
              className="note note-error"
            >
              {state.message}
            </p>
          )}

          <button type="submit" disabled={pending} className="azapay-auth-submit">
            {pending ? (
              <>
                <span className="azapay-spinner" aria-hidden="true" />
                Loading
              </>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>

      <div className="azapay-auth-promo" aria-hidden="true">
        <h2>Money in, automatic splits, sent exactly where you tell it to go</h2>
        <p>AzaPay sends your tithe, family support, bills and savings to the bank accounts you choose, the moment your income lands.</p>
        <div className="azapay-float-wrap">
          <div className="azapay-float-card azapay-float-hero">
            <small>Flow</small>
            <br />
            <b>Auto-split</b>
          </div>
          <div className="azapay-float-card azapay-float-pay">
            <small>Pays</small>
            <br />
            <b>On time</b>
            <br />
            <small>Wherever you tell them to go</small>
          </div>
          <div className="azapay-float-card azapay-float-week">
            <small>Savings</small>
            <br />
            <b>In Azas</b>
          </div>
        </div>
      </div>
    </main>
  )
}
