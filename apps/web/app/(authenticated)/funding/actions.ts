"use server"

import { run } from "effection"
import { revalidatePath } from "next/cache"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { ServerConfigContext, loadServerConfig } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import {
  completeBankLink,
  listBanks,
  startBankLink,
} from "@/src/features/funding/operations"
import {
  bankLinkOtpSchema,
  bankLinkIdSchema,
  bankLinkSelectionSchema,
} from "@/src/features/funding/schemas"

export type FundingFormState =
  | {
      readonly message: string
      readonly success: boolean
      readonly bankLinkId?: string
      readonly fundingConnectionId?: string
    }
  | null

/** Start a bank-link verification flow by resolving the chosen account. */
export async function startBankLinkAction(
  _state: FundingFormState,
  formData: FormData
): Promise<FundingFormState> {
  const input = bankLinkSelectionSchema.safeParse({
    bank_code: formData.get("bank_code"),
    account_number: formData.get("account_number"),
  })

  if (!input.success) {
    return {
      message: "Select a bank and enter its 10-digit account number.",
      success: false,
    }
  }

  const config = loadServerConfig()
  if (!config) {
    return {
      message: "Funding connections are temporarily unavailable. Try again later.",
      success: false,
    }
  }

  const result = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/funding")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    const banks = yield* listBanks()
    if (banks._tag === "Left") return { kind: "bank-list-error" as const }

    const bank = banks.right.find(({ code }) => code === input.data.bank_code)
    if (!bank) return { kind: "invalid-bank" as const }

    const outcome = yield* startBankLink({
      ...input.data,
      bank_name: bank.name,
    })

    return { kind: "bank-link-result" as const, outcome }
  })

  if (result.kind === "invalid-bank") {
    return {
      message: "Select a bank from the available options and try again.",
      success: false,
    }
  }

  if (result.kind === "bank-list-error") {
    return {
      message: "We couldn’t load the bank options. Refresh and try again.",
      success: false,
    }
  }

  if (result.outcome._tag === "Left") {
    return {
      message:
        result.outcome.left.kind === "http-status" &&
        result.outcome.left.status === 422
          ? "This bank account could not be verified. Check the details and try again."
          : "The bank link could not be started right now.",
      success: false,
    }
  }

  revalidatePath("/funding")

  return {
    message:
      "Bank verification started. Enter the OTP from your bank to finish connecting this account.",
    success: true,
    bankLinkId: result.outcome.right.id,
  }
}

/** Complete a bank-link verification after the customer receives the provider OTP. */
export async function completeBankLinkAction(
  _state: FundingFormState,
  formData: FormData
): Promise<FundingFormState> {
  const input = bankLinkOtpSchema.safeParse({
    otp: formData.get("otp"),
  })

  const bankLinkId = String(formData.get("bank_link_id") ?? "")

  if (!input.success || !bankLinkIdSchema.safeParse(bankLinkId).success) {
    return {
      message: "Enter the bank-link OTP to continue.",
      success: false,
    }
  }

  const config = loadServerConfig()
  if (!config) {
    return {
      message: "Funding verification is temporarily unavailable.",
      success: false,
    }
  }

  const outcome = await run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/funding")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* completeBankLink(bankLinkId, input.data)
  })

  if (outcome._tag === "Left") {
    return {
      message:
        outcome.left.kind === "http-status" && outcome.left.status === 422
          ? "The OTP is invalid or expired. Please try again."
          : "We couldn’t complete the bank verification. Try again.",
      success: false,
    }
  }

  revalidatePath("/funding")

  return {
    message:
      outcome.right.funding_connection_id
        ? "Bank account verified and connected."
        : `Bank verification is ${outcome.right.status}.`,
    success: true,
    fundingConnectionId: outcome.right.funding_connection_id ?? undefined,
  }
}
