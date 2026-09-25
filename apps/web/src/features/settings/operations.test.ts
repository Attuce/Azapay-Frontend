import { compose, createFetchHandler, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { updateProfile, updateSettings } from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(withBaseUrl("https://api.example.test"))(
    createFetchHandler({ fetch })
  )
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
    return yield* updateProfile("access", {
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
    return yield* updateSettings("access", { timezone: "" })
  })

  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-request", operation: "update-settings" },
  })
  expect(fetch).not.toHaveBeenCalled()
})
