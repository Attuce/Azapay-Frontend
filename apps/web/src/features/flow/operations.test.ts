import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import {
  archiveFlowCategory,
  connectFlow,
  connectFlowCategory,
  createFlowCategory,
  getFlow,
  getFlowHistory,
  getFlowUpcoming,
  updateFlow,
  updateFlowCategory,
  updateFlowCategoryAmount,
} from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(
    withBaseUrl("https://api.example.test"),
    withAuth("access")
  )(createFetchHandler({ fetch }))
}

test("Flow category creation sends a two-decimal amount string to the contract", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/categories")
    expect(request.method).toBe("POST")
    expect(await request.json()).toMatchObject({
      name: "Emergency fund",
      amount_per_run: "2500.00",
      currency: "NGN",
      frequency: "monthly",
      day_of_month: 5,
      day_of_week: null,
      domain_side: "flow",
    })

    return Response.json({
      id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      domain_side: "flow",
      flow_id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
      aza_id: null,
      name: "Emergency fund",
      description: null,
      amount_per_run: "2500.00",
      currency: "NGN",
      frequency: "monthly",
      day_of_month: null,
      day_of_week: null,
      next_run_at: null,
      timezone: "Africa/Lagos",
      status: "active",
      default_funding_connection_id: null,
      has_funding: false,
      archived_at: null,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    }, { status: 201 })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* createFlowCategory({
      name: "Emergency fund",
      amount_per_run: "2500.00",
      day_of_month: 5,
      day_of_week: null,
      domain_side: "flow",
    })
  })

  expect(result._tag).toBe("Right")
})

test("invalid Flow amounts and category IDs never reach the API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>()
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    const create = yield* createFlowCategory({
      name: "Emergency fund",
      amount_per_run: "2500.5",
      domain_side: "flow",
    })
    const update = yield* updateFlowCategoryAmount("../unexpected-path", "2500.00")
    return { create, update }
  })

  expect(result.create).toMatchObject({ _tag: "Left", left: { kind: "invalid-request" } })
  expect(result.update).toMatchObject({ _tag: "Left", left: { kind: "invalid-request" } })
  expect(fetch).not.toHaveBeenCalled()
})

test("Flow details, amount, and archive use their documented endpoints", async () => {
  const id = "4435098f-89ab-4a7e-93e6-985f1d4c9bc0"
  const responseBody = {
    id,
    domain_side: "flow",
    flow_id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
    aza_id: null,
    name: "Emergency fund",
    description: null,
    amount_per_run: "2750.00",
    currency: "NGN",
    frequency: "weekly",
    day_of_month: null,
    day_of_week: 1,
    next_run_at: "2026-10-12T09:00:00Z",
    timezone: "Africa/Lagos",
    status: "archived",
    default_funding_connection_id: null,
    has_funding: false,
    archived_at: "2026-10-10T10:00:00Z",
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  }
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname
    if (path === `/v1/categories/${id}` && request.method === "PATCH") {
      expect(await request.json()).toEqual({ name: "Emergency fund", frequency: "weekly", status: "paused" })
    } else if (path === `/v1/categories/${id}/amount` && request.method === "PATCH") {
      expect(await request.json()).toEqual({ amount_per_run: "2750.00" })
    } else {
      expect(path).toBe(`/v1/categories/${id}`)
      expect(request.method).toBe("DELETE")
    }
    return Response.json(responseBody)
  })

  const outcomes = await run(function* () {
    yield* HttpContext.set(client(fetch))
    const details = yield* updateFlowCategory(id, {
      name: "Emergency fund",
      frequency: "weekly",
      status: "paused",
    })
    const amount = yield* updateFlowCategoryAmount(id, "2750.00")
    const archived = yield* archiveFlowCategory(id)
    return [details, amount, archived]
  })

  expect(outcomes.map((outcome) => outcome._tag)).toEqual(["Right", "Right", "Right"])
  expect(fetch).toHaveBeenCalledTimes(3)
})

test("Flow settings update through the Flow endpoint", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/flows/me")
    expect(request.method).toBe("PATCH")
    expect(await request.json()).toEqual({ name: "My Flow", description: null, status: "paused" })

    return Response.json({
      id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
      name: "My Flow",
      description: null,
      currency: "NGN",
      status: "paused",
      default_funding_connection_id: null,
      has_funding: false,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    })
  })

  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* updateFlow({ name: "My Flow", description: null, status: "paused" })
  })

  expect(outcome).toMatchObject({ _tag: "Right", right: { status: "paused" } })
})

test("Flow state is read and validated through its feature operation", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/flows/me")
    return Response.json({
      id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
      name: "My Flow",
      description: null,
      currency: "NGN",
      status: "active",
      default_funding_connection_id: null,
      has_funding: true,
      created_at: "2026-10-10T10:00:00Z",
      updated_at: "2026-10-10T10:00:00Z",
    })
  })

  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* getFlow()
  })

  expect(outcome).toMatchObject({ _tag: "Right", right: { name: "My Flow", has_funding: true } })
})

test("Flow and category funding connections use their contract endpoints", async () => {
  const flowId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"
  const categoryId = "4435098f-89ab-4a7e-93e6-985f1d4c9bc0"
  const fundingId = "8b555d95-7a0e-4d64-956a-7d83aed10649"
  const flow = {
    id: flowId,
    name: "My Flow",
    description: null,
    currency: "NGN",
    status: "active",
    default_funding_connection_id: fundingId,
    has_funding: true,
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  }
  const category = {
    id: categoryId,
    domain_side: "flow",
    flow_id: flowId,
    aza_id: null,
    name: "Emergency fund",
    description: null,
    amount_per_run: "2500.00",
    currency: "NGN",
    frequency: "monthly",
    day_of_month: null,
    day_of_week: null,
    next_run_at: null,
    timezone: "Africa/Lagos",
    status: "active",
    default_funding_connection_id: fundingId,
    has_funding: true,
    archived_at: null,
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  }
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname
    expect(request.method).toBe("POST")
    expect(await request.json()).toEqual({ funding_connection_id: fundingId })
    if (path === `/v1/flows/${flowId}/connect`) return Response.json(flow)
    expect(path).toBe(`/v1/categories/${categoryId}/connect`)
    return Response.json(category)
  })

  const outcomes = await run(function* () {
    yield* HttpContext.set(client(fetch))
    const flowResult = yield* connectFlow(flowId, fundingId)
    const categoryResult = yield* connectFlowCategory(categoryId, fundingId)
    return [flowResult, categoryResult]
  })

  expect(outcomes.map((outcome) => outcome._tag)).toEqual(["Right", "Right"])
})

test("upcoming Flow runs preserve API readiness and money strings", async () => {
  const flowId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe(`/v1/flows/${flowId}/upcoming`)
    return Response.json([{
      category_id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      category_name: "Emergency fund",
      next_run_at: "2026-11-01T09:00:00Z",
      overdue: false,
      amount: "2500.00",
      currency: "NGN",
      frequency: "monthly",
      destinations: [],
      readiness: {
        flow_active: true,
        category_active: true,
        has_destinations: true,
        conserves: true,
        funded: false,
        ready: false,
        issues: ["Connect an active funding source."],
      },
      funding: { fundable: false, message: "No active source." },
    }])
  })

  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* getFlowUpcoming(flowId)
  })

  expect(outcome).toMatchObject({
    _tag: "Right",
    right: [{ amount: "2500.00", readiness: { ready: false }, funding: { fundable: false } }],
  })
})

test("Flow run history validates fees, outcomes, recovery, and child payment details", async () => {
  const flowId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe(`/v1/flows/${flowId}/history`)
    return Response.json([{
      id: "f6818262-f2b4-4c08-8c29-07ae845583ec",
      category_id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      category_name: "Emergency fund",
      total_amount: "2500.00",
      fee: "25.00",
      currency: "NGN",
      status: "settled",
      collection_reference: "collect-123",
      scheduled_for: null,
      collected_at: "2026-10-10T10:00:00Z",
      settled_at: "2026-10-10T10:01:00Z",
      failed_at: null,
      failure_reason: null,
      recovery_attempts: 0,
      recovered_at: null,
      recovery_status: "none",
      created_at: "2026-10-10T10:00:00Z",
      children: [{
        id: "739cac2f-596e-4ce0-aa9b-48439e2d4a81",
        pay_id: null,
        amount: "2500.00",
        status: "succeeded",
        attempt: 1,
        beneficiary_name: "Savings account",
        destination_type: "bank",
        bank_name: "Example Bank",
        account_number: "1234567890",
        account_name: "Savings account",
        aza_id: null,
        item_status: "succeeded",
        item_failure_reason: null,
        provider_reference: "provider-123",
        reference: "reference-123",
        attempt_count: 1,
        succeeded_at: "2026-10-10T10:01:00Z",
        recovery_status: null,
      }],
    }])
  })

  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* getFlowHistory(flowId)
  })

  expect(outcome).toMatchObject({
    _tag: "Right",
    right: [{
      total_amount: "2500.00",
      fee: "25.00",
      recovery_status: "none",
      children: [{ account_number: "1234567890", amount: "2500.00" }],
    }],
  })
})
