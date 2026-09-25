import { compose, createFetchHandler, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { currentUser, refreshTokens, register, signIn } from "./operations"

const user = {
  id: "40e1d68b-93af-4cd6-af8f-5a025d788dd1",
  email: "ada@example.com",
  username: null,
  full_name: "Ada Okon",
  phone_number: null,
  status: "active",
  currency: "NGN",
  identity_status: "email_verified",
  email_verified_at: null,
  last_login_at: null,
  created_at: "2026-09-24T10:00:00Z",
  updated_at: "2026-09-24T10:00:00Z",
}

function client(fetch: typeof globalThis.fetch) {
  return compose(withBaseUrl("https://api.example.test"))(
    createFetchHandler({ fetch })
  )
}

test("sign-in sends the OpenAPI payload and validates the token response", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/auth/login")
    expect(request.method).toBe("POST")
    expect(await request.json()).toEqual({
      email: "ada@example.com",
      password: "secret123",
    })
    return Response.json({
      access_token: "access",
      refresh_token: "refresh",
      expires_at: "2026-09-24T11:00:00Z",
      refresh_expires_at: "2026-10-24T10:00:00Z",
      user,
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* signIn({ email: "ada@example.com", password: "secret123" })
  })
  expect(result._tag).toBe("Right")
  expect(fetch).toHaveBeenCalledOnce()
})

test("invalid registration never reaches the API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}))
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* register({
      email: "invalid",
      password: "short",
      full_name: "Ada Okon",
    })
  })
  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-request", operation: "register" },
  })
  expect(fetch).not.toHaveBeenCalled()
})

test("refresh rotates the presented refresh token", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/auth/refresh")
    expect(await request.json()).toEqual({ refresh_token: "old-refresh" })

    return Response.json({
      access_token: "new-access",
      refresh_token: "new-refresh",
      expires_at: "2099-01-01T01:00:00Z",
      refresh_expires_at: "2099-02-01T00:00:00Z",
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* refreshTokens({ refresh_token: "old-refresh" })
  })

  expect(result._tag).toBe("Right")
  expect(fetch).toHaveBeenCalledOnce()
})

test("a malformed account response is not shown as a signed-in user", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ ...user, status: "unknown" })
  )
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* currentUser("access")
  })
  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-response", operation: "whoami" },
  })
})

test("halting an account request aborts the backend fetch", async () => {
  let aborted = false
  const fetch = vi.fn<typeof globalThis.fetch>(
    (input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = input instanceof Request ? input.signal : init?.signal
        signal?.addEventListener("abort", () => {
          aborted = true
          reject(new DOMException("aborted", "AbortError"))
        })
      })
  )

  const task = run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* currentUser("access")
  })
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
  await task.halt()
  expect(aborted).toBe(true)
})
