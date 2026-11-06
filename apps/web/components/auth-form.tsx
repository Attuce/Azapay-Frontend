"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Landmark, Search, User } from "lucide-react"
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
      {isRegister && (
        <Link href="/login" className="azapay-auth-back" aria-label="Back to sign in">
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
      )}
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
          <div className="azapay-phone">
            <div className="azapay-phone-screen">
              <div className="azapay-phone-search"><Search size={11} strokeWidth={2.5} aria-hidden="true" /> Search &lsquo;Pays&rsquo;</div>
              <div className="azapay-phone-hero">
                <span><small>Flow Balance</small><br /><b>&#8358;60,000</b></span>
                <span className="azapay-phone-connect">Connect &hellip;</span>
              </div>
              <div className="azapay-phone-list">
                <div className="azapay-phone-list-head"><b>Recent Pays</b><span>View all</span></div>
                <div className="azapay-phone-row"><span className="azapay-phone-dot"><Landmark size={10} aria-hidden="true" /></span>Income<b className="azapay-phone-pos">+&#8358;3,000</b></div>
                <div className="azapay-phone-row"><span className="azapay-phone-dot"><Building2 size={10} aria-hidden="true" /></span>Staff payroll<b>&minus;&#8358;2,500</b></div>
                <div className="azapay-phone-row"><span className="azapay-phone-dot"><User size={10} aria-hidden="true" /></span>Mom<b>&minus;&#8358;450</b></div>
              </div>
            </div>
          </div>

          <div className="azapay-phone-float azapay-phone-week">
            <small>Weekly Overview</small>
            <br />
            <b>&#8358; 1500</b>
            <br />
            <small>Amount</small>
            <svg width="100%" height="34" viewBox="0 0 102 34" role="presentation" focusable="false" aria-hidden="true">
              <rect x="0" y="18" width="10" height="16" rx="3" fill="#c3d0ff" />
              <rect x="15" y="9" width="10" height="25" rx="3" fill="#a9bdff" />
              <rect x="30" y="14" width="10" height="20" rx="3" fill="#8ea8ff" />
              <rect x="45" y="6" width="10" height="28" rx="3" fill="#6d8dff" />
              <rect x="60" y="1" width="10" height="33" rx="3" fill="#2764ff" />
              <rect x="75" y="12" width="10" height="22" rx="3" fill="#8ea8ff" />
              <rect x="90" y="8" width="12" height="26" rx="3" fill="#3b6cf8" />
            </svg>
          </div>

          <div className="azapay-phone-float azapay-phone-pay">
            <div className="azapay-phone-pay-row"><span className="azapay-phone-ngn">NGN <ChevronDown size={10} aria-hidden="true" /></span><span><small>This Pay sends</small><br /><b>20%</b></span></div>
            <div className="azapay-phone-pay-row"><span className="azapay-phone-ngn">NGN <ChevronDown size={10} aria-hidden="true" /></span><span><small>Goto</small><br /><b>Mom, GTBank &#8226;&#8226;&#8226;&#8226;1234</b></span></div>
            <span className="azapay-phone-lockpay">Lock Pay <ChevronRight size={12} aria-hidden="true" /></span>
          </div>
        </div>
      </div>
    </main>
  )
}
