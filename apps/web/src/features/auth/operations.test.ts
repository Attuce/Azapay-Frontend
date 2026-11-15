import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { currentUser } from "./operations"

const user = {
  id: "40e1d68b-93af-4cd6-af8f-5a025d788dd1",
  email: "ada@example.com",
  full_name: "Ada Okon",
  username: null,
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
  return compose(
    withBaseUrl("https://api.example.test"),
    withAuth("clerk-session-token")
  )(createFetchHandler({ fetch }))
}

test("current principal uses the Clerk bearer token and validates the API user", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/auth/me")
    expect(request.headers.get("authorization")).toBe("Bearer clerk-session-token")
    return Response.json(user)
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* currentUser()
  })

  expect(result).toEqual({ _tag: "Right", right: user })
  expect(fetch).toHaveBeenCalledOnce()
})

test("a malformed account response is not shown as a signed-in user", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ ...user, status: "unknown" })
  )
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* currentUser()
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
    return yield* currentUser()
  })
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
  await task.halt()
  expect(aborted).toBe(true)
})
