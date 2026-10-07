import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { getOverview } from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(
    withBaseUrl("https://api.example.test"),
    withAuth("access")
  )(createFetchHandler({ fetch }))
}

test("overview is read from the backend and preserves money strings", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/analytics/overview")
    expect(request.headers.get("authorization")).toBe("Bearer access")

    return Response.json({
      generated_at: "2026-09-27T10:00:00Z",
      categories: 2,
      active_categories: 1,
      azas: 0,
      total_allocated_per_run: "25000.00",
      total_executed: "50000.00",
      total_fees: "0.00",
      total_saved: "0.00",
      total_returns: "0.00",
      open_reconciliation_events: 0,
      failed_executions: 0,
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* getOverview()
  })

  expect(result).toEqual({
    _tag: "Right",
    right: expect.objectContaining({ total_allocated_per_run: "25000.00" }),
  })
})
