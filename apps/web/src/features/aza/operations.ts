import { json, validate } from "@jamx/http"
import { until, useAbortSignal, type Operation } from "effection"
import { left, right } from "fp-ts/Either"
import { z } from "zod"
import { HttpContext } from "../../application/context"
import type { Outcome } from "../../application/errors"
import {
  azaCreateSchema, azaIdSchema, azaMemberSchema, azaPositionSchema, azaSchema, azaUpdateSchema, closeAzaSchema, contributionCreateSchema,
  contributionInstructionSchema, contributionSchema, inviteCreateSchema, inviteIdSchema, inviteSchema, inviteTokenSchema,
  maturedReleaseSchema, withdrawalConfirmSchema, withdrawalRequestSchema, withdrawalSchema,
  type Aza, type AzaCreateInput, type AzaMember, type AzaPosition, type AzaUpdateInput, type Contribution, type Invite, type Withdrawal,
} from "./schemas"

function* request<T>(
  operation: string,
  path: string,
  schema: z.ZodType,
  options?: { method?: string; body?: unknown },
): Operation<Outcome<T>> {
  const http = yield* HttpContext.expect()
  const signal = yield* useAbortSignal()
  try {
    const response = yield* until(http(path, {
      method: options?.method,
      headers: options?.body === undefined ? undefined : { "content-type": "application/json" },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body), signal,
    }))
    if (!response.ok) return left({ kind: "transport", operation })
    if (!response.value.ok) return left({ kind: "http-status", operation, status: response.value.status })
    const decoded = yield* until(json(response.value))
    const result = yield* until(validate(decoded, schema))
    if (!result.ok) return left({ kind: "invalid-response", operation })
    return right(result.value as T)
  } catch {
    return left({ kind: "transport", operation })
  }
}

/** List Azas visible to the authenticated customer. */
export function* listAzas(): Operation<Outcome<Aza[]>> {
  return yield* request("list-azas", "/v1/azas", azaSchema.array())
}

/** Read one Aza by its contract UUID. */
export function* getAza(id: string): Operation<Outcome<Aza>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "get-aza" })
  return yield* request("get-aza", `/v1/azas/${parsed.data}`, azaSchema)
}

/** Read the backend-confirmed position for an Aza. */
export function* getAzaPosition(id: string): Operation<Outcome<AzaPosition>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "get-aza-position" })
  return yield* request("get-aza-position", `/v1/azas/${parsed.data}/position`, azaPositionSchema)
}

/** List members visible to the authenticated customer. */
export function* listAzaMembers(id: string): Operation<Outcome<AzaMember[]>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "list-aza-members" })
  return yield* request("list-aza-members", `/v1/azas/${parsed.data}/members`, azaMemberSchema.array())
}

/** Create an Aza through the backend lifecycle contract. */
export function* createAza(input: AzaCreateInput): Operation<Outcome<Aza>> {
  const parsed = azaCreateSchema.safeParse(input)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "create-aza" })
  return yield* request("create-aza", "/v1/azas", azaSchema, { method: "POST", body: parsed.data })
}

/** Update customer-editable Aza metadata. */
export function* updateAza(id: string, input: AzaUpdateInput): Operation<Outcome<Aza>> {
  const parsedId = azaIdSchema.safeParse(id)
  const parsed = azaUpdateSchema.safeParse(input)
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "update-aza" })
  return yield* request("update-aza", `/v1/azas/${parsedId.data}`, azaSchema, { method: "PATCH", body: parsed.data })
}

/** List Aza invitations visible to its members. */
export function* listAzaInvites(id: string): Operation<Outcome<Invite[]>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "list-aza-invites" })
  return yield* request("list-aza-invites", `/v1/azas/${parsed.data}/invites`, inviteSchema.array())
}

/** Invite a member by email; the API controls role and expiry policy. */
export function* createAzaInvite(id: string, input: z.input<typeof inviteCreateSchema>): Operation<Outcome<Invite>> {
  const parsedId = azaIdSchema.safeParse(id)
  const parsed = inviteCreateSchema.safeParse(input)
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "create-aza-invite" })
  return yield* request("create-aza-invite", `/v1/azas/${parsedId.data}/invites`, inviteSchema, { method: "POST", body: parsed.data })
}

/** Revoke a pending invitation. */
export function* revokeAzaInvite(azaId: string, inviteId: string): Operation<Outcome<Invite>> {
  const parsedAzaId = azaIdSchema.safeParse(azaId)
  const parsedInviteId = inviteIdSchema.safeParse(inviteId)
  if (!parsedAzaId.success || !parsedInviteId.success) return left({ kind: "invalid-request", operation: "revoke-aza-invite" })
  return yield* request("revoke-aza-invite", `/v1/azas/${parsedAzaId.data}/invites/${parsedInviteId.data}`, inviteSchema, { method: "DELETE" })
}

/** Accept an invitation token supplied by the customer. */
export function* acceptAzaInvite(token: string): Operation<Outcome<Invite>> {
  const parsed = inviteTokenSchema.safeParse({ invite_token: token })
  if (!parsed.success) return left({ kind: "invalid-request", operation: "accept-aza-invite" })
  return yield* request("accept-aza-invite", "/v1/azas/invites/accept", inviteSchema, { method: "POST", body: parsed.data })
}

/** Read contribution history for an Aza. */
export function* listAzaContributions(id: string): Operation<Outcome<Contribution[]>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "list-aza-contributions" })
  return yield* request("list-aza-contributions", `/v1/azas/${parsed.data}/contributions`, contributionSchema.array())
}

/** Request a contribution once; a successful response creates a payment instruction, not a settled contribution. */
export function* createAzaContribution(id: string, input: z.input<typeof contributionCreateSchema>): Operation<Outcome<unknown>> {
  const parsedId = azaIdSchema.safeParse(id)
  const parsed = contributionCreateSchema.safeParse(input)
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "create-aza-contribution" })
  return yield* request("create-aza-contribution", `/v1/azas/${parsedId.data}/contributions`, contributionInstructionSchema, { method: "POST", body: parsed.data })
}

/** Read backend withdrawal quotes and lifecycle state for an Aza. */
export function* listAzaWithdrawals(id: string): Operation<Outcome<Withdrawal[]>> {
  const parsed = azaIdSchema.safeParse(id)
  if (!parsed.success) return left({ kind: "invalid-request", operation: "list-aza-withdrawals" })
  return yield* request("list-aza-withdrawals", `/v1/azas/${parsed.data}/withdrawals`, withdrawalSchema.array())
}

/** Request one withdrawal quote using a caller-generated idempotency key; writes are never replayed. */
export function* requestAzaWithdrawal(id: string, input: z.input<typeof withdrawalRequestSchema>): Operation<Outcome<Withdrawal>> {
  const parsedId = azaIdSchema.safeParse(id)
  const parsed = withdrawalRequestSchema.safeParse(input)
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "request-aza-withdrawal" })
  return yield* request("request-aza-withdrawal", `/v1/azas/${parsedId.data}/withdrawals`, withdrawalSchema, { method: "POST", body: parsed.data })
}

/** Cancel a withdrawal only while the backend still allows cancellation. */
export function* cancelAzaWithdrawal(azaId: string, withdrawalId: string): Operation<Outcome<Withdrawal>> {
  const parsedAzaId = azaIdSchema.safeParse(azaId)
  const parsedWithdrawalId = azaIdSchema.safeParse(withdrawalId)
  if (!parsedAzaId.success || !parsedWithdrawalId.success) return left({ kind: "invalid-request", operation: "cancel-aza-withdrawal" })
  return yield* request("cancel-aza-withdrawal", `/v1/azas/${parsedAzaId.data}/withdrawals/${parsedWithdrawalId.data}/cancel`, withdrawalSchema, { method: "POST" })
}

/** Confirm a quoted withdrawal with provider bank details. The backend validates the provider bank ID before liquidation. */
export function* confirmAzaWithdrawal(azaId: string, withdrawalId: string, input: z.input<typeof withdrawalConfirmSchema>): Operation<Outcome<Withdrawal>> {
  const parsedAzaId = azaIdSchema.safeParse(azaId)
  const parsedWithdrawalId = azaIdSchema.safeParse(withdrawalId)
  const parsed = withdrawalConfirmSchema.safeParse(input)
  if (!parsedAzaId.success || !parsedWithdrawalId.success || !parsed.success) return left({ kind: "invalid-request", operation: "confirm-aza-withdrawal" })
  return yield* request("confirm-aza-withdrawal", `/v1/azas/${parsedAzaId.data}/withdrawals/${parsedWithdrawalId.data}/confirm`, withdrawalSchema, { method: "POST", body: parsed.data })
}

/** Release a matured target Aza using the backend's whole-position release operation. */
export function* releaseMaturedAza(azaId: string, idempotencyKey: string): Operation<Outcome<Withdrawal>> {
  const parsedId = azaIdSchema.safeParse(azaId)
  const parsed = maturedReleaseSchema.safeParse({ idempotency_key: idempotencyKey })
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "release-matured-aza" })
  return yield* request("release-matured-aza", `/v1/azas/${parsedId.data}/withdrawals/release`, withdrawalSchema, { method: "POST", body: parsed.data })
}

/** Close an Aza only when its backend-enforced lifecycle rules permit closure. */
export function* closeAza(id: string, reason?: string | null): Operation<Outcome<Aza>> {
  const parsedId = azaIdSchema.safeParse(id)
  const parsed = closeAzaSchema.safeParse({ reason })
  if (!parsedId.success || !parsed.success) return left({ kind: "invalid-request", operation: "close-aza" })
  return yield* request("close-aza", `/v1/azas/${parsedId.data}/close`, azaSchema, { method: "POST", body: parsed.data })
}
