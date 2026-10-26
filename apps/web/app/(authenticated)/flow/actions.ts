"use server"

import { run, type Operation } from "effection"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AccessTokenContext, HttpContext } from "@/src/application/context"
import { ServerConfigContext, loadServerConfig } from "@/src/server/config"
import { createAuthenticatedServerHttp } from "@/src/server/http"
import { requirePageSession } from "@/src/server/session"
import {
  archiveFlowCategory,
  connectFlow,
  connectFlowCategory,
  createFlowCategory,
  updateFlow,
  updateFlowCategory,
  updateFlowCategoryAmount,
} from "@/src/features/flow/operations"
import {
  activateFlowPay,
  createFlowPay,
  createFlowSave,
  pauseFlowPay,
  updateFlowPay,
  updateFlowPayDestination,
  updateFlowSave,
} from "@/src/features/flow/instruction-operations"
import {
  flowPayCreateSchema,
  flowPayDestinationSchema,
  flowPayUpdateSchema,
  flowSaveCreateSchema,
  flowSaveUpdateSchema,
} from "@/src/features/flow/instruction-schemas"
import {
  categoryIdSchema,
  flowCategoryCreateSchema,
  flowCategoryUpdateSchema,
  flowConnectSchema,
  flowIdSchema,
  flowUpdateSchema,
} from "@/src/features/flow/schemas"

/** Safe customer-facing result returned by Flow server actions. */
export type FlowFormState = {
  readonly message: string
  readonly success: boolean
} | null

async function withFlowHttp<T>(operation: Operation<T>): Promise<T | null> {
  const config = loadServerConfig()
  if (!config) return null

  return run(function* () {
    yield* ServerConfigContext.set(config)
    const session = yield* requirePageSession("/flow")
    yield* AccessTokenContext.set(session.access_token)
    const http = yield* createAuthenticatedServerHttp()
    yield* HttpContext.set(http)
    return yield* operation
  })
}

/** Save the customer's Flow name and account-level status. */
export async function updateFlowAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const input = flowUpdateSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || null,
    status: formData.get("status"),
  })
  if (!input.success)
    {return { message: "Check the Flow details and try again.", success: false }}
  const outcome = await withFlowHttp(updateFlow(input.data))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return { message: "We couldn’t update Flow. Try again.", success: false }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: "Flow updated.", success: true }
}

/** Connect or clear Flow's default funding source. */
export async function connectFlowAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const flowId = flowIdSchema.safeParse(formData.get("flow_id"))
  const input = flowConnectSchema.safeParse({
    funding_connection_id:
      String(formData.get("funding_connection_id") ?? "") || null,
  })
  if (!flowId.success || !input.success)
    {return { message: "Select a valid funding source.", success: false }}
  const outcome = await withFlowHttp(
    connectFlow(flowId.data, input.data.funding_connection_id)
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update Flow funding. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: "Flow funding source updated.", success: true }
}

/** Connect or clear a category's default funding source. */
export async function connectFlowCategoryAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const categoryId = categoryIdSchema.safeParse(formData.get("category_id"))
  const input = flowConnectSchema.safeParse({
    funding_connection_id:
      String(formData.get("funding_connection_id") ?? "") || null,
  })
  if (!categoryId.success || !input.success)
    {return { message: "Select a valid funding source.", success: false }}
  const outcome = await withFlowHttp(
    connectFlowCategory(categoryId.data, input.data.funding_connection_id)
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update category funding. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: "Category funding source updated.", success: true }
}

/** Create a Flow category after validating the submitted values at the action boundary. */
export async function createFlowCategoryAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const input = flowCategoryCreateSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || null,
    amount_per_run: formData.get("amount_per_run"),
    frequency: formData.get("frequency"),
    day_of_month: optionalInteger(formData.get("day_of_month")),
    day_of_week: optionalInteger(formData.get("day_of_week")),
    domain_side: "flow",
  })

  if (!input.success)
    {return {
      message: "Check the instruction details and try again.",
      success: false,
    }}

  const outcome = await withFlowHttp(createFlowCategory(input.data))

  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}

  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t create this instruction. Review the details and try again.",
      success: false,
    }}

  revalidatePath("/flow")
  revalidatePath("/")

  return { message: "Instruction created.", success: true }
}

/** Update a Flow instruction's amount through its dedicated API operation. */
export async function updateFlowCategoryAmountAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const id = categoryIdSchema.safeParse(formData.get("category_id"))
  const amount = String(formData.get("amount_per_run") ?? "")
  if (!id.success)
    {return { message: "Select a valid instruction.", success: false }}
  const outcome = await withFlowHttp(updateFlowCategoryAmount(id.data, amount))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update this amount. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: "Amount updated for future runs.", success: true }
}

/** Update a Flow instruction's customer-facing details and future frequency. */
export async function updateFlowCategoryDetailsAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const id = categoryIdSchema.safeParse(formData.get("category_id"))
  const input = flowCategoryUpdateSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || null,
    frequency: formData.get("frequency"),
    day_of_month: optionalInteger(formData.get("day_of_month")),
    day_of_week: optionalInteger(formData.get("day_of_week")),
  })
  if (!id.success || !input.success) {
    return {
      message: "Check the instruction details and try again.",
      success: false,
    }
  }
  const outcome = await withFlowHttp(updateFlowCategory(id.data, input.data))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left") {
    return {
      message: "We couldn’t update this instruction. Try again.",
      success: false,
    }
  }
  revalidatePath("/flow")
  revalidatePath("/")
  return {
    message: "Instruction details updated for future runs.",
    success: true,
  }
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const stringValue = String(value ?? "")
  return stringValue === "" ? null : Number(stringValue)
}

/** Pause or resume a Flow instruction for future runs. */
export async function toggleFlowCategoryAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const id = categoryIdSchema.safeParse(formData.get("category_id"))
  const status = flowCategoryUpdateSchema.shape.status.safeParse(
    formData.get("next_status")
  )
  if (!id.success || !status.success || !status.data) {
    return { message: "Select a valid instruction status.", success: false }
  }
  const outcome = await withFlowHttp(
    updateFlowCategory(id.data, { status: status.data })
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update this instruction. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: `Instruction ${status.data}.`, success: true }
}

/** Archive a Flow instruction; the API retains its history as a soft delete. */
export async function archiveFlowCategoryAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const id = categoryIdSchema.safeParse(formData.get("category_id"))
  if (!id.success)
    {return { message: "Select a valid instruction.", success: false }}
  const outcome = await withFlowHttp(archiveFlowCategory(id.data))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t archive this instruction. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  revalidatePath("/")
  return { message: "Instruction archived.", success: true }
}

/** Create a payment instruction inside a Flow category. */
export async function createFlowPayAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const input = flowPayCreateSchema.safeParse({
    category_id: formData.get("category_id"),
    funding_connection_id:
      String(formData.get("funding_connection_id") ?? "") || null,
    beneficiary_name: formData.get("beneficiary_name"),
    amount: formData.get("amount"),
    destination_type: formData.get("destination_type"),
    aza_id: String(formData.get("aza_id") ?? "") || null,
    bank_code: String(formData.get("bank_code") ?? "") || null,
    bank_name: String(formData.get("bank_name") ?? "") || null,
    account_number: String(formData.get("account_number") ?? "") || null,
    frequency: formData.get("frequency"),
    day_of_month: optionalInteger(formData.get("day_of_month")),
    day_of_week: optionalInteger(formData.get("day_of_week")),
    timezone: "Africa/Lagos",
    memo: String(formData.get("memo") ?? "") || null,
  })

  if (!input.success)
    {return {
      message: "Check the payment destination, amount, and schedule.",
      success: false,
    }}

  if (!categoryIdSchema.safeParse(input.data.category_id).success)
    {return { message: "Choose a Flow category.", success: false }}

  const outcome = await withFlowHttp(createFlowPay(input.data))

  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}

  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t create this payment. Check the details and try again.",
      success: false,
    }}

  revalidatePath("/flow")

  return {
    message:
      "Payment instruction created. Review its status before scheduling it.",
    success: true,
  }
}

/** Update a payment amount or memo without changing its destination. */
export async function updateFlowPayAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const payId = String(formData.get("pay_id") ?? "")
  const input = flowPayUpdateSchema.safeParse({
    amount: formData.get("amount"),
    memo: String(formData.get("memo") ?? "") || null,
    frequency: formData.get("frequency"),
    day_of_month: optionalInteger(formData.get("day_of_month")),
    day_of_week: optionalInteger(formData.get("day_of_week")),
  })
  if (!input.success)
    {return { message: "Enter a valid amount and memo.", success: false }}
  const outcome = await withFlowHttp(updateFlowPay(payId, input.data))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update this payment. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  return { message: "Payment details updated.", success: true }
}

/** Change a payment destination while backend state still permits that edit. */
export async function updateFlowPayDestinationAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const input = flowPayDestinationSchema.safeParse({
    destination_type: formData.get("destination_type"),
    bank_code: String(formData.get("bank_code") ?? "") || null,
    account_number: String(formData.get("account_number") ?? "") || null,
    aza_id: String(formData.get("aza_id") ?? "") || null,
  })
  if (!input.success)
    {return {
      message: "Check the destination details and try again.",
      success: false,
    }}
  const outcome = await withFlowHttp(
    updateFlowPayDestination(String(formData.get("pay_id") ?? ""), input.data)
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t change this destination. It may be locked after a successful payment.",
      success: false,
    }}
  revalidatePath("/flow")
  return { message: "Payment destination updated.", success: true }
}

/** Pause or activate a payment instruction using its documented lifecycle endpoint. */
export async function transitionFlowPayAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const payId = String(formData.get("pay_id") ?? "")
  const action = z.enum(["pause", "activate"]).safeParse(formData.get("action"))
  if (!action.success)
    {return { message: "Choose a valid payment action.", success: false }}
  const outcome = await withFlowHttp(
    action.data === "pause" ? pauseFlowPay(payId) : activateFlowPay(payId)
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t update the payment status. Review readiness and try again.",
      success: false,
    }}
  revalidatePath("/flow")
  return {
    message:
      action.data === "pause"
        ? "Payment paused."
        : "Payment scheduled according to API readiness.",
    success: true,
  }
}

/** Create a scheduled savings instruction for an existing Aza. */
export async function createFlowSaveAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const mode = formData.get("mode")
  const trigger = formData.get("trigger")
  const input = flowSaveCreateSchema.safeParse({
    aza_id: formData.get("aza_id"),
    category_id: formData.get("category_id"),
    funding_connection_id:
      String(formData.get("funding_connection_id") ?? "") || null,
    mode,
    amount:
      mode === "amount" ? String(formData.get("amount") ?? "") || null : null,
    share_percent:
      mode === "share"
        ? String(formData.get("share_percent") ?? "") || null
        : null,
    trigger,
    frequency: trigger === "scheduled" ? formData.get("frequency") : null,
    day_of_month:
      trigger === "scheduled"
        ? optionalInteger(formData.get("day_of_month"))
        : null,
    day_of_week:
      trigger === "scheduled"
        ? optionalInteger(formData.get("day_of_week"))
        : null,
    timezone: "Africa/Lagos",
    name: String(formData.get("name") ?? "") || null,
    memo: String(formData.get("memo") ?? "") || null,
  })
  if (!input.success)
    {return {
      message: "Choose an Aza and enter a valid amount and schedule.",
      success: false,
    }}
  if (!categoryIdSchema.safeParse(input.data.category_id).success)
    {return { message: "Choose a Flow category.", success: false }}
  const outcome = await withFlowHttp(createFlowSave(input.data))
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t create this saving. Review the details and try again.",
      success: false,
    }}
  revalidatePath("/flow")
  return { message: "Savings instruction created.", success: true }
}

/** Update a savings instruction amount or name without changing its Aza destination. */
export async function updateFlowSaveAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const mode = formData.get("mode")
  const trigger = formData.get("trigger")
  const input = flowSaveUpdateSchema.safeParse({
    mode,
    amount: mode === "amount" ? formData.get("amount") : null,
    share_percent: mode === "share" ? formData.get("share_percent") : null,
    name: String(formData.get("name") ?? "") || null,
    trigger,
    frequency: trigger === "scheduled" ? formData.get("frequency") : null,
    day_of_month:
      trigger === "scheduled"
        ? optionalInteger(formData.get("day_of_month"))
        : null,
    day_of_week:
      trigger === "scheduled"
        ? optionalInteger(formData.get("day_of_week"))
        : null,
  })
  if (!input.success)
    {return { message: "Enter a valid amount and name.", success: false }}
  const outcome = await withFlowHttp(
    updateFlowSave(String(formData.get("save_id") ?? ""), input.data)
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update this saving. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  return { message: "Savings instruction updated.", success: true }
}

/** Change a save's Aza destination while backend state still permits that edit. */
export async function updateFlowSaveDestinationAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const azaId = z.uuid().safeParse(formData.get("aza_id"))
  if (!azaId.success)
    {return { message: "Choose a valid Aza destination.", success: false }}
  const outcome = await withFlowHttp(
    updateFlowSave(String(formData.get("save_id") ?? ""), {
      aza_id: azaId.data,
    })
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message:
        "We couldn’t change this destination. It may be locked after a successful save.",
      success: false,
    }}
  revalidatePath("/flow")
  return { message: "Savings destination updated.", success: true }
}

/** Pause or resume a savings instruction through the API's status contract. */
export async function transitionFlowSaveAction(
  _state: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const status = z
    .enum(["paused", "scheduled"])
    .safeParse(formData.get("next_status"))
  if (!status.success)
    {return { message: "Choose a valid savings status.", success: false }}
  const outcome = await withFlowHttp(
    updateFlowSave(String(formData.get("save_id") ?? ""), {
      status: status.data,
    })
  )
  if (!outcome)
    {return { message: "Flow is temporarily unavailable.", success: false }}
  if (outcome._tag === "Left")
    {return {
      message: "We couldn’t update this saving. Try again.",
      success: false,
    }}
  revalidatePath("/flow")
  return {
    message:
      status.data === "paused"
        ? "Savings instruction paused."
        : "Savings instruction resumed.",
    success: true,
  }
}
