"use server"

import { run, type Operation } from "effection"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { loadServerConfig, ServerConfigContext } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import { createAza, createAzaContribution, createAzaInvite, acceptAzaInvite, requestAzaWithdrawal, cancelAzaWithdrawal, confirmAzaWithdrawal, closeAza, releaseMaturedAza, revokeAzaInvite, updateAza } from "@/src/features/aza/operations"
import { azaCreateSchema, azaIdSchema, azaUpdateSchema, contributionCreateSchema, inviteCreateSchema, inviteIdSchema, withdrawalConfirmSchema, withdrawalRequestSchema } from "@/src/features/aza/schemas"

export type AzaFormState = { readonly message: string; readonly success: boolean } | null

async function withAzaHttp<T>(operation: Operation<T>): Promise<T | null> {
  const config = loadServerConfig()
  if (!config) return null
  return run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/azas")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* operation
  })
}

function feedback(outcome: { _tag: "Left" } | { _tag: "Right" } | null, failure: string, success: string): Exclude<AzaFormState, null> {
  return !outcome ? { message: "AzaPay is temporarily unavailable.", success: false }
    : outcome._tag === "Left" ? { message: failure, success: false } : { message: success, success: true }
}

/** Create an Aza from validated form fields. */
export async function createAzaAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const input = azaCreateSchema.safeParse({
    name: formData.get("name"), description: textOrNull(formData.get("description")), purpose: textOrNull(formData.get("purpose")),
    visibility: formData.get("visibility"), is_shared: formData.get("visibility") === "private", mode: formData.get("mode"), target_amount: textOrNull(formData.get("target_amount")),
    deadline: textOrNull(formData.get("deadline")), maturity_date: textOrNull(formData.get("maturity_date")),
  })
  if (!input.success) return { message: "Check the Aza details and try again.", success: false }
  const result = feedback(await withAzaHttp(createAza(input.data)), "We couldn’t create this Aza. Review the details and try again.", "Aza created.")
  if (result.success) revalidatePath("/azas")
  return result
}

/** Update the editable name and description for an Aza. */
export async function updateAzaAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const input = azaUpdateSchema.safeParse({ name: formData.get("name"), description: textOrNull(formData.get("description")) })
  if (!id.success || !input.success) return { message: "Check the Aza details and try again.", success: false }
  const result = feedback(await withAzaHttp(updateAza(id.data, input.data)), "We couldn’t update this Aza. Try again.", "Aza details updated.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Invite a member by email. */
export async function createAzaInviteAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const input = inviteCreateSchema.safeParse({ email: formData.get("email"), expires_in_days: Number(formData.get("expires_in_days") || 7) })
  if (!id.success || !input.success) return { message: "Enter a valid email address.", success: false }
  const result = feedback(await withAzaHttp(createAzaInvite(id.data, input.data)), "We couldn’t send this invitation. Try again.", "Invitation sent.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Revoke an invitation while it is pending. */
export async function revokeAzaInviteAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const inviteId = inviteIdSchema.safeParse(formData.get("invite_id"))
  if (!id.success || !inviteId.success) return { message: "Select a valid invitation.", success: false }
  const result = feedback(await withAzaHttp(revokeAzaInvite(id.data, inviteId.data)), "We couldn’t revoke this invitation.", "Invitation revoked.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Accept an invitation using its customer-provided token. */
export async function acceptAzaInviteAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const token = z.string().trim().min(1).safeParse(formData.get("invite_token"))
  if (!token.success) return { message: "Enter your invitation token.", success: false }
  const result = feedback(await withAzaHttp(acceptAzaInvite(token.data)), "We couldn’t accept this invitation. Check the token and try again.", "Invitation accepted.")
  if (result.success) revalidatePath("/azas")
  return result
}

/** Request a bank-funded contribution. The API response starts an instruction; it does not mean funds settled. */
export async function createAzaContributionAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const input = contributionCreateSchema.safeParse({ funding_connection_id: formData.get("funding_connection_id"), amount: formData.get("amount"), memo: textOrNull(formData.get("memo")) })
  if (!id.success || !input.success) return { message: "Select a funding source and enter an amount with two decimal places.", success: false }
  const result = feedback(await withAzaHttp(createAzaContribution(id.data, input.data)), "We couldn’t start this contribution. Try again.", "Contribution instruction started. Check its status below.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Request an API-priced withdrawal using one stable idempotency key per submission. */
export async function requestAzaWithdrawalAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const input = withdrawalRequestSchema.safeParse({ amount: formData.get("amount"), idempotency_key: formData.get("idempotency_key") })
  if (!id.success || !input.success) return { message: "Enter a valid amount and request key.", success: false }
  const result = feedback(await withAzaHttp(requestAzaWithdrawal(id.data, input.data)), "We couldn’t request this withdrawal. Check the Aza status before trying again.", "Withdrawal quote requested. Review the API-provided quote and status below.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Cancel a withdrawal only if the backend accepts the cancellation. */
export async function cancelAzaWithdrawalAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const withdrawalId = azaIdSchema.safeParse(formData.get("withdrawal_id"))
  if (!id.success || !withdrawalId.success) return { message: "Select a valid withdrawal.", success: false }
  const result = feedback(await withAzaHttp(cancelAzaWithdrawal(id.data, withdrawalId.data)), "We couldn’t cancel this withdrawal.", "Withdrawal cancelled.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Submit destination details for an API-quoted withdrawal. */
export async function confirmAzaWithdrawalAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const withdrawalId = azaIdSchema.safeParse(formData.get("withdrawal_id"))
  const input = withdrawalConfirmSchema.safeParse({
    destination_type: "bank", bank_code: formData.get("bank_code"), bank_name: formData.get("bank_name"),
    account_number: formData.get("account_number"), account_name: formData.get("account_name"),
    beneficiary_name: formData.get("beneficiary_name"), provider_bank_id: formData.get("provider_bank_id"),
  })
  if (!id.success || !withdrawalId.success || !input.success) return { message: "Enter valid bank details and provider bank ID.", success: false }
  const result = feedback(await withAzaHttp(confirmAzaWithdrawal(id.data, withdrawalId.data, input.data)), "We couldn’t confirm this withdrawal. Check its status before trying again.", "Bank payout instruction submitted. Check the updated status below.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Request closure; the backend decides whether balances and active references allow it. */
export async function closeAzaAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  if (!id.success) return { message: "Select a valid Aza.", success: false }
  const result = feedback(await withAzaHttp(closeAza(id.data, textOrNull(formData.get("reason")))), "The backend couldn’t close this Aza. Resolve any active position or references and try again.", "Aza closed.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

/** Request backend-controlled release for an Aza the API marks matured. */
export async function releaseMaturedAzaAction(_state: AzaFormState, formData: FormData): Promise<AzaFormState> {
  const id = azaIdSchema.safeParse(formData.get("aza_id"))
  const key = z.string().min(8).max(120).safeParse(formData.get("idempotency_key"))
  if (!id.success || !key.success) return { message: "Could not validate the matured release request.", success: false }
  const result = feedback(await withAzaHttp(releaseMaturedAza(id.data, key.data)), "The backend couldn’t release this Aza. Check its status before trying again.", "Release requested. Review the withdrawal state below.")
  if (result.success) revalidatePath(`/azas/${id.data}`)
  return result
}

function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim()
  return text || null
}
