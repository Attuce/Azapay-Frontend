import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import { toFlowPayView, type FlowPay } from "./instruction-schemas"
import {
  activateFlowPay,
  createFlowPay,
  createFlowSave,
  listFlowAzaOptions,
  listFlowBanks,
  pauseFlowPay,
  updateFlowPay,
  updateFlowSave,
} from "./instruction-operations"

const flowId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"
const categoryId = "4435098f-89ab-4a7e-93e6-985f1d4c9bc0"
const instructionId = "739cac2f-596e-4ce0-aa9b-48439e2d4a81"
const azaId = "8b555d95-7a0e-4d64-956a-7d83aed10649"
const userId = "22f603cb-5148-4ab5-a196-25f0f63d9713"
const timestamp = "2026-10-10T10:00:00Z"

function client(fetch: typeof globalThis.fetch) {
  return compose(withBaseUrl("https://api.example.test"), withAuth("access"))(createFetchHandler({ fetch }))
}

function pay(status: FlowPay["status"] = "draft"): FlowPay {
  return {
    id: instructionId,
    user_id: userId,
    flow_id: flowId,
    category_id: categoryId,
    funding_connection_id: null,
    funding_complete: false,
    beneficiary_name: "Rent",
    destination_type: "bank",
    bank_code: "044",
    bank_name: "Example Bank",
    account_number: "1234567890",
    aza_id: null,
    amount: "2500.00",
    currency: "NGN",
    frequency: "monthly",
    day_of_month: 5,
    day_of_week: null,
    next_run_at: null,
    status,
    destination_locked: false,
    first_settled_at: null,
    memo: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
}

function save() {
  return {
    id: instructionId,
    user_id: userId,
    aza_id: azaId,
    category_id: categoryId,
    funding_connection_id: null,
    funding_complete: false,
    mode: "amount",
    share_percent: null,
    trigger: "scheduled",
    locked: false,
    locked_until: null,
    amount: "2500.00",
    currency: "NGN",
    frequency: "monthly",
    day_of_month: 5,
    day_of_week: null,
    next_run_at: null,
    status: "scheduled",
    paused: false,
    destination_locked: false,
    first_settled_at: null,
    name: "Emergency fund",
    memo: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
}

test("Flow payments create with money strings and use their lifecycle endpoints", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname
    if (path === "/v1/pays" && request.method === "POST") {
      expect(await request.json()).toMatchObject({ category_id: categoryId, amount: "2500.00", destination_type: "bank" })
      return Response.json(pay(), { status: 201 })
    }
    if (path === `/v1/pays/${instructionId}/pause`) return Response.json(pay("paused"))
    if (path === `/v1/pays/${instructionId}/activate`) return Response.json(pay("scheduled"))
    if (path === `/v1/pays/${instructionId}` && request.method === "PATCH") {
      expect(await request.json()).toEqual({ amount: "2750.00", memo: "Monthly rent" })
      return Response.json(pay())
    }
    return Response.json({ unexpected: `${request.method} ${path}` }, { status: 500 })
  })

  const outcomes = await run(function* () {
    yield* HttpContext.set(client(fetch))
    const created = yield* createFlowPay({
      category_id: categoryId,
      funding_connection_id: null,
      beneficiary_name: "Rent",
      amount: "2500.00",
      destination_type: "bank",
      bank_code: "044",
      account_number: "1234567890",
      frequency: "monthly",
      day_of_month: 5,
    })
    const edited = yield* updateFlowPay(instructionId, { amount: "2750.00", memo: "Monthly rent" })
    const paused = yield* pauseFlowPay(instructionId)
    const activated = yield* activateFlowPay(instructionId)
    return [created, edited, paused, activated]
  })

  expect(outcomes.map((outcome) => outcome._tag)).toEqual(["Right", "Right", "Right", "Right"])
  expect(fetch).toHaveBeenCalledTimes(4)
})

test("Flow savings create and update preserve API amount strings", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname
    if (path === "/v1/saves" && request.method === "POST") {
      expect(await request.json()).toMatchObject({ aza_id: azaId, category_id: categoryId, amount: "2500.00", mode: "amount" })
      return Response.json(save(), { status: 201 })
    }
    expect(path).toBe(`/v1/saves/${instructionId}`)
    expect(request.method).toBe("PATCH")
    expect(await request.json()).toEqual({ amount: "3000.00", name: "Long term" })
    return Response.json({ ...save(), amount: "3000.00", name: "Long term" })
  })

  const outcomes = await run(function* () {
    yield* HttpContext.set(client(fetch))
    const created = yield* createFlowSave({
      aza_id: azaId,
      category_id: categoryId,
      funding_connection_id: null,
      amount: "2500.00",
      frequency: "monthly",
      day_of_month: 5,
      timezone: "Africa/Lagos",
      name: "Emergency fund",
    })
    const updated = yield* updateFlowSave(instructionId, { amount: "3000.00", name: "Long term" })
    return [created, updated]
  })

  expect(outcomes.map((outcome) => outcome._tag)).toEqual(["Right", "Right"])
  expect(fetch).toHaveBeenCalledTimes(2)
})

test("Flow instruction lookups validate Aza and bank choice data", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const path = new URL(new Request(input, init).url).pathname
    if (path === "/v1/azas") return Response.json([{ id: azaId, name: "Rainy day", status: "active", principal: "9000.00" }])
    expect(path).toBe("/v1/banks")
    return Response.json([{ code: "044", name: "Example Bank" }])
  })

  const outcomes = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return [yield* listFlowAzaOptions(), yield* listFlowBanks()]
  })

  expect(outcomes).toEqual([
    { _tag: "Right", right: [{ id: azaId, name: "Rainy day", status: "active" }] },
    { _tag: "Right", right: [{ code: "044", name: "Example Bank" }] },
  ])
})

test("invalid Flow instruction amounts and path IDs never reach the API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>()
  const outcome = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* createFlowPay({
      category_id: categoryId,
      funding_connection_id: null,
      beneficiary_name: "Rent",
      amount: "2500.5",
      destination_type: "bank",
      bank_code: "044",
      account_number: "1234567890",
    })
  })

  expect(outcome).toMatchObject({ _tag: "Left", left: { kind: "invalid-request" } })
  expect(fetch).not.toHaveBeenCalled()
})

test("payment browser view removes the full bank account number", () => {
  const safeView = toFlowPayView(pay())

  expect(safeView).not.toHaveProperty("account_number")
  expect(safeView).toMatchObject({ id: instructionId, bank_name: "Example Bank" })
})
