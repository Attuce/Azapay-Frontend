import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { requestAzaWithdrawal, createAzaContribution } from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(withBaseUrl("https://api.example.test"), withAuth("access"))(createFetchHandler({ fetch }))
}

test("withdrawal requests send exact amount strings and are never automatically replayed", async () => {
  const azaId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe(`/v1/azas/${azaId}/withdrawals`)
    expect(request.method).toBe("POST")
    expect(await request.json()).toEqual({ amount: "125.00", idempotency_key: "withdrawal-key-123" })
    return Response.json({ detail: "temporary failure" }, { status: 503 })
  })
  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* requestAzaWithdrawal(azaId, { amount: "125.00", idempotency_key: "withdrawal-key-123" })
  })
  expect(outcome).toMatchObject({ _tag: "Left", left: { kind: "http-status", status: 503 } })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test("invalid contribution amounts and Aza IDs never reach the API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>()
  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* createAzaContribution("../not-an-id", { funding_connection_id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0", amount: "10.5" })
  })
  expect(outcome).toMatchObject({ _tag: "Left", left: { kind: "invalid-request" } })
  expect(fetch).not.toHaveBeenCalled()
})
