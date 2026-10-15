import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { deactivateAccount, getConsents, recordConsent, updateProfile, updateSettings } from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(
    withBaseUrl("https://api.example.test"),
    withAuth("access")
  )(createFetchHandler({ fetch }))
}

test("profile update validates and sends only contract fields", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/users/me")
    expect(request.method).toBe("PATCH")
    expect(request.headers.get("authorization")).toBe("Bearer access")
    expect(await request.json()).toEqual({
      full_name: "Ada Okon",
      username: "ada_okon",
      phone_number: null,
    })

    return Response.json({
      id: "40e1d68b-93af-4cd6-af8f-5a025d788dd1",
      email: "ada@example.com",
      username: "ada_okon",
      full_name: "Ada Okon",
      phone_number: null,
      status: "active",
      currency: "NGN",
      identity_status: "email_verified",
      email_verified_at: null,
      last_login_at: null,
      created_at: "2026-09-24T10:00:00Z",
      updated_at: "2026-09-24T11:00:00Z",
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* updateProfile({
      full_name: "Ada Okon",
      username: "ada_okon",
      phone_number: null,
    })
  })

  expect(result._tag).toBe("Right")
})

test("invalid settings never reach the API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}))
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* updateSettings({ timezone: "" })
  })

  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-request", operation: "update-settings" },
  })
  expect(fetch).not.toHaveBeenCalled()
})

test("consent acceptance posts the backend-published scope and version", async () => {
  const response = { required_consents: { terms: "2026-10" }, my_consents: { terms: { version: "2026-10", accepted_at: "2026-10-15T10:00:00Z", required: true } } }
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/users/me/consent")
    expect(request.method).toBe("POST")
    expect(await request.json()).toEqual({ scope: "terms", version: "2026-10" })
    return Response.json(response)
  })
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* recordConsent({ scope: "terms", version: "2026-10" })
  })
  expect(result).toMatchObject({ _tag: "Right", right: response })
})

test("account deactivation expects a single 204 response", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/users/me/deactivate")
    expect(request.method).toBe("POST")
    return new Response(null, { status: 204 })
  })
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* deactivateAccount()
  })
  expect(result).toEqual({ _tag: "Right", right: undefined })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test("consent requirements are validated before use", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ required_consents: [], my_consents: {} }))
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* getConsents()
  })
  expect(result).toMatchObject({ _tag: "Left", left: { kind: "invalid-response", operation: "get-consents" } })
})
