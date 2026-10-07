import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  bankLinkOtpSchema,
  bankLinkIdSchema,
  bankLinkSchema,
  bankLinkStartSchema,
  bankSchema,
  fundingConnectionCreateSchema,
  fundingConnectionSchema,
  fundingConnectionUpdateSchema,
  type Bank,
  type BankLink,
  type BankLinkOtpInput,
  type BankLinkStartInput,
  type FundingConnection,
  type FundingConnectionCreateInput,
  type FundingConnectionUpdateInput,
} from "./schemas"

/** List banks available for the customer to link a funding source. */
export function* listBanks(): Operation<Outcome<Bank[]>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(http("/v1/banks", { signal }))
    if (!response.ok)
      return left({ kind: "transport", operation: "list-banks" })
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "list-banks",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, bankSchema.array()))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "list-banks" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-banks" })
  }
}

/** Start bank-link verification and resolve the account before OTP confirmation. */
export function* startBankLink(
  input: BankLinkStartInput
): Operation<Outcome<BankLink>> {
  const request = bankLinkStartSchema.safeParse(input)
  if (!request.success) {
    return left({ kind: "invalid-request", operation: "start-bank-link" })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/funding-connections/bank-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) {
      return left({ kind: "transport", operation: "start-bank-link" })
    }

    console.log(yield* until(response.value.clone().text()))

    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "start-bank-link",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, bankLinkSchema))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "start-bank-link" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "start-bank-link" })
  }
}

/** Complete the provider OTP step and return the bank-link state. */
export function* completeBankLink(
  bankLinkId: string,
  input: BankLinkOtpInput
): Operation<Outcome<BankLink>> {
  const request = bankLinkOtpSchema.safeParse(input)
  const id = bankLinkIdSchema.safeParse(bankLinkId)
  if (!request.success || !id.success) {
    return left({ kind: "invalid-request", operation: "complete-bank-link" })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http(`/v1/funding-connections/bank-links/${id.data}/otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) {
      return left({ kind: "transport", operation: "complete-bank-link" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "complete-bank-link",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, bankLinkSchema))
    if (!validated.ok) {
      return left({ kind: "invalid-response", operation: "complete-bank-link" })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "complete-bank-link" })
  }
}

/** Create a funding connection once a provider step has resolved the account. */
export function* createFundingConnection(
  input: FundingConnectionCreateInput
): Operation<Outcome<FundingConnection>> {
  const request = fundingConnectionCreateSchema.safeParse(input)
  if (!request.success) {
    return left({
      kind: "invalid-request",
      operation: "create-funding-connection",
    })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http("/v1/funding-connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) {
      return left({ kind: "transport", operation: "create-funding-connection" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "create-funding-connection",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, fundingConnectionSchema))
    if (!validated.ok) {
      return left({
        kind: "invalid-response",
        operation: "create-funding-connection",
      })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "create-funding-connection" })
  }
}

/** List the connected funding sources available for the customer's instructions. */
export function* listFundingConnections(): Operation<
  Outcome<FundingConnection[]>
> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(http("/v1/funding-connections", { signal }))
    if (!response.ok) {
      return left({ kind: "transport", operation: "list-funding-connections" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "list-funding-connections",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(
      validate(decoded, fundingConnectionSchema.array())
    )
    if (!validated.ok) {
      return left({
        kind: "invalid-response",
        operation: "list-funding-connections",
      })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "list-funding-connections" })
  }
}

/** Read the current state of one funding source, including provider verification status. */
export function* getFundingConnection(
  fundingConnectionId: string
): Operation<Outcome<FundingConnection>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http(`/v1/funding-connections/${fundingConnectionId}`, { signal })
    )

    if (!response.ok) {
      return left({ kind: "transport", operation: "get-funding-connection" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "get-funding-connection",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, fundingConnectionSchema))
    if (!validated.ok) {
      return left({
        kind: "invalid-response",
        operation: "get-funding-connection",
      })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "get-funding-connection" })
  }
}

/** Set or clear the default funding connection for the account. */
export function* updateFundingConnection(
  fundingConnectionId: string,
  input: FundingConnectionUpdateInput
): Operation<Outcome<FundingConnection>> {
  const request = fundingConnectionUpdateSchema.safeParse(input)
  if (!request.success) {
    return left({
      kind: "invalid-request",
      operation: "update-funding-connection",
    })
  }

  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http(`/v1/funding-connections/${fundingConnectionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.data),
        signal,
      })
    )

    if (!response.ok) {
      return left({ kind: "transport", operation: "update-funding-connection" })
    }
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "update-funding-connection",
        status: response.value.status,
      })
    }

    const decoded = yield* until(json(response.value))
    const validated = yield* until(validate(decoded, fundingConnectionSchema))
    if (!validated.ok) {
      return left({
        kind: "invalid-response",
        operation: "update-funding-connection",
      })
    }

    return right(validated.value)
  } catch {
    return left({ kind: "transport", operation: "update-funding-connection" })
  }
}

/** Revoke a funding connection when the customer removes it. */
export function* revokeFundingConnection(
  fundingConnectionId: string
): Operation<Outcome<void>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()

  try {
    const response = yield* until(
      http(`/v1/funding-connections/${fundingConnectionId}/revoke`, {
        method: "POST",
        signal,
      })
    )

    if (!response.ok)
      return left({ kind: "transport", operation: "revoke-funding-connection" })
    if (!response.value.ok) {
      return left({
        kind: "http-status",
        operation: "revoke-funding-connection",
        status: response.value.status,
      })
    }

    return right(undefined)
  } catch {
    return left({ kind: "transport", operation: "revoke-funding-connection" })
  }
}
