import { compose, createFetchHandler, withAuth, withBaseUrl } from "@jamx/http"
import { run } from "effection"
import { expect, test, vi } from "vitest"
import { HttpContext } from "../../application/context"
import {
  completeBankLink,
  createFundingConnection,
  listBanks,
  listFundingConnections,
  startBankLink,
} from "./operations"

function client(fetch: typeof globalThis.fetch) {
  return compose(
    withBaseUrl("https://api.example.test"),
    withAuth("access")
  )(createFetchHandler({ fetch }))
}

const connection = {
  id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
  kind: "bank_account",
  status: "pending_verification",
  is_default: false,
  currency: "NGN",
  account_name: "Ada Okon",
  bank_name: "Access Bank",
  bank_code: "044",
  account_number_last4: "1234",
  has_authorization: true,
  verified_at: null,
  revoked_at: null,
  created_at: "2026-09-24T10:00:00Z",
  updated_at: "2026-09-24T10:00:00Z",
}

test("bank list is contract validated and returned to the UI", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json([
      { code: "044", name: "Access Bank" },
      { code: "014", name: "First Bank" },
    ])
  )

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* listBanks()
  })

  expect(result._tag).toBe("Right")
  if (result._tag !== "Right") throw new Error("expected success")
  expect(result.right).toEqual([
    { code: "044", name: "Access Bank" },
    { code: "014", name: "First Bank" },
  ])
})

test("bank link handshake validates the provider start step", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe("/v1/funding-connections/bank-links")
    expect(request.method).toBe("POST")
    expect(await request.json()).toEqual({
      bank_code: "044",
      bank_name: "Access Bank",
      account_number: "0123456789",
    })

    return Response.json({
      id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      status: "pending_verification",
      bank_code: "044",
      account_number_last4: "6789",
      resolved_account_name: "Ada Okon",
      funding_connection_id: null,
      failure_reason: null,
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* startBankLink({
      bank_code: "044",
      bank_name: "Access Bank",
      account_number: "0123456789",
    })
  })

  expect(result._tag).toBe("Right")
})

test("otp completion validates the bank provider response", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const request = new Request(input, init)
    expect(new URL(request.url).pathname).toBe(
      "/v1/funding-connections/bank-links/4435098f-89ab-4a7e-93e6-985f1d4c9bc0/otp"
    )
    expect(await request.json()).toEqual({ otp: "123456" })

    return Response.json({
      id: "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      status: "active",
      bank_code: "044",
      account_number_last4: "6789",
      resolved_account_name: "Ada Okon",
      funding_connection_id: "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a",
      failure_reason: null,
    })
  })

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* completeBankLink(
      "4435098f-89ab-4a7e-93e6-985f1d4c9bc0",
      { otp: "123456" }
    )
  })

  expect(result._tag).toBe("Right")
})

test("invalid bank-link IDs never reach the OTP endpoint", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}))
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* completeBankLink("../unexpected-path", { otp: "123456" })
  })

  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-request", operation: "complete-bank-link" },
  })
  expect(fetch).not.toHaveBeenCalled()
})

test("funding connection creation is contract-safeguarded", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(connection))

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* createFundingConnection({
      kind: "bank_account",
      bank_name: "Access Bank",
      bank_code: "044",
      account_name: "Ada Okon",
      account_number_last4: "1234",
      is_default: true,
    })
  })

  expect(result._tag).toBe("Right")
  if (result._tag !== "Right") throw new Error("expected success")
  expect(result.right.kind).toBe("bank_account")
})

test("invalid funding inputs never reach the backend", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}))
  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* startBankLink({
      bank_code: "",
      bank_name: "Access Bank",
      account_number: "123",
    })
  })

  expect(result).toEqual({
    _tag: "Left",
    left: { kind: "invalid-request", operation: "start-bank-link" },
  })
  expect(fetch).not.toHaveBeenCalled()
})

test("list funding connections validates the page payload", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json([connection])
  )

  const result = await run(function* () {
    yield* HttpContext.set(client(fetch))
    return yield* listFundingConnections()
  })

  expect(result._tag).toBe("Right")
  if (result._tag !== "Right") throw new Error("expected success")
  expect(result.right).toHaveLength(1)
})
