"use server"

import { run } from "effection"
import { redirect } from "next/navigation"
import { HttpContext } from "@/src/application/context"
import { register, signIn, signOut } from "@/src/features/auth/operations"
import { loginSchema, registerSchema } from "@/src/features/auth/schemas"
import { clearSession, readSession, writeSession } from "@/src/server/session"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createServerHttp } from "@/src/server/http"

/** A safe, user-facing form error; credentials and tokens never return to React. */
export type AuthFormState = { message: string } | null

/** Validate the form, sign in, and save the token pair in one Effection scope. */
export async function loginAction(
  _state: AuthFormState,
  form: FormData
): Promise<AuthFormState> {
  const input = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  })

  if (!input.success) return { message: "Enter a valid email and password." }

  const config = loadServerConfig()
  if (!config) {
    return { message: "Sign-in is temporarily unavailable. Try again later." }
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const http = yield* createServerHttp()
    yield* HttpContext.set(http)

    const auth = yield* signIn(input.data)
    if (auth._tag === "Left") return { auth, sessionWritten: false }

    const sessionWritten = yield* writeSession(auth.right)
    return { auth, sessionWritten }
  })

  if (outcome.auth._tag === "Left") {
    return {
      message:
        outcome.auth.left.kind === "http-status" &&
        outcome.auth.left.status === 401
          ? "Email or password is incorrect."
          : "We couldn't sign you in. Try again.",
    }
  }

  if (!outcome.sessionWritten) {
    return { message: "Sign-in is temporarily unavailable. Try again later." }
  }

  redirect("/")
}

/** Register the required account fields and save the returned session. */
export async function registerAction(
  _state: AuthFormState,
  form: FormData
): Promise<AuthFormState> {
  const input = registerSchema.safeParse({
    full_name: form.get("full_name"),
    email: form.get("email"),
    password: form.get("password"),
  })

  if (!input.success) {
    return {
      message:
        "Enter your name, a valid email, and a password of at least 8 characters.",
    }
  }

  const config = loadServerConfig()
  if (!config) {
    return {
      message: "Account creation is temporarily unavailable. Try again later.",
    }
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const http = yield* createServerHttp()
    yield* HttpContext.set(http)

    const auth = yield* register(input.data)
    if (auth._tag === "Left") return { auth, sessionWritten: false }

    const sessionWritten = yield* writeSession(auth.right)
    return { auth, sessionWritten }
  })

  if (outcome.auth._tag === "Left") {
    return {
      message:
        outcome.auth.left.kind === "http-status" &&
        outcome.auth.left.status === 409
          ? "An account with this email already exists."
          : "We couldn't create your account. Check your details and try again.",
    }
  }

  if (!outcome.sessionWritten) {
    return {
      message:
        "Account created, but sign-in is temporarily unavailable. Please sign in later.",
    }
  }

  redirect("/")
}

/** Attempt backend revocation, then clear the browser session in one scope. */
export async function logoutAction(): Promise<void> {
  const config = loadServerConfig()

  await run(function* () {
    if (config) {
      yield* ServerConfigContext.set(config)
      const http = yield* createServerHttp()
      yield* HttpContext.set(http)

      const session = yield* readSession()
      if (session && Date.parse(session.expires_at) > Date.now()) {
        yield* signOut(session.access_token, session.refresh_token)
      }
    }

    yield* clearSession()
  })

  redirect("/login")
}
