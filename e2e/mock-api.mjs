import { createServer } from "node:http"

const user = {
  id: "66ec1e2c-5d98-4e93-baa1-477c249ce1a1",
  email: "journey@example.test",
  full_name: "Journey Test",
  username: null,
  phone_number: null,
  status: "active",
  currency: "NGN",
  identity_status: "unverified",
  email_verified_at: null,
  last_login_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

const settings = {
  timezone: "Africa/Lagos",
  email_transactional: true,
  email_marketing: false,
  push_enabled: true,
  weekly_digest: false,
  updated_at: "2026-01-01T00:00:00.000Z",
}

let consents = { required_consents: { terms: "2026-10" }, my_consents: {} }
let fundingConnections = []
const bankLinkId = "4435098f-89ab-4a7e-93e6-985f1d4c9bc0"
const fundingConnectionId = "0a268992-7c93-4f8a-a6ee-3a72bf89ef8a"

function makeFundingConnection({ bankCode, accountName, last4, isDefault = false }) {
  const now = new Date().toISOString()
  const bank = bankCode === "044" ? "Access Bank" : "First Bank"
  const connection = {
    id: fundingConnectionId,
    kind: "bank_account",
    status: "active",
    is_default: isDefault,
    currency: "NGN",
    account_name: accountName,
    bank_name: bank,
    bank_code: bankCode,
    account_number_last4: last4,
    has_authorization: true,
    verified_at: now,
    revoked_at: null,
    created_at: now,
    updated_at: now,
  }
  fundingConnections = [connection]
  return connection
}

function respond(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(body))
}

async function readBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:3101")
  const method = request.method ?? "GET"

  if (url.pathname === "/health") {
    response.writeHead(204)
    response.end()
    return
  }

  if (url.pathname === "/v1/auth/register" && method === "POST") {
    consents = { required_consents: { terms: "2026-10" }, my_consents: {} }
    fundingConnections = []
    const now = new Date().toISOString()
    const input = await readBody(request)
    respond(response, 201, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refresh_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        ...user,
        email: input.email,
        full_name: input.full_name,
        created_at: now,
        updated_at: now,
      },
    })
    return
  }

  if (url.pathname.startsWith("/v1/") && !url.pathname.startsWith("/v1/auth/register")) {
    if (request.headers.authorization !== "Bearer test-access-token") {
      respond(response, 401, { detail: "Unauthorized" })
      return
    }
  }

  if (url.pathname === "/v1/auth/me") {
    respond(response, 200, user)
    return
  }

  if (url.pathname === "/v1/users/me" && method === "GET") {
    respond(response, 200, user)
    return
  }

  if (url.pathname === "/v1/users/me" && method === "PATCH") {
    Object.assign(user, await readBody(request), { updated_at: new Date().toISOString() })
    respond(response, 200, user)
    return
  }

  if (url.pathname === "/v1/settings" && method === "GET") {
    respond(response, 200, settings)
    return
  }

  if (url.pathname === "/v1/settings" && method === "PATCH") {
    Object.assign(settings, await readBody(request), { updated_at: new Date().toISOString() })
    respond(response, 200, settings)
    return
  }

  if (url.pathname === "/v1/users/me/consent" && method === "GET") {
    respond(response, 200, consents)
    return
  }

  if (url.pathname === "/v1/users/me/consent" && method === "POST") {
    const input = await readBody(request)
    consents.my_consents[input.scope] = {
      version: input.version,
      accepted_at: new Date().toISOString(),
      required: true,
    }
    respond(response, 200, consents)
    return
  }

  if (url.pathname === "/v1/users/me/deactivate" && method === "POST") {
    response.writeHead(204)
    response.end()
    return
  }

  if (url.pathname === "/v1/banks" && method === "GET") {
    respond(response, 200, [
      { code: "044", name: "Access Bank" },
      { code: "014", name: "First Bank" },
    ])
    return
  }

  if (url.pathname === "/v1/funding-connections" && method === "GET") {
    respond(response, 200, fundingConnections)
    return
  }

  if (url.pathname === "/v1/funding-connections/bank-links" && method === "POST") {
    const input = await readBody(request)
    const accountNumberLast4 = input.account_number.slice(-4)

    if (accountNumberLast4 === "0002") {
      const connection = makeFundingConnection({
        bankCode: input.bank_code,
        accountName: "Journey Test",
        last4: accountNumberLast4,
      })
      respond(response, 201, {
        id: bankLinkId,
        status: "succeeded",
        bank_code: input.bank_code,
        account_number_last4: accountNumberLast4,
        resolved_account_name: connection.account_name,
        funding_connection_id: connection.id,
        failure_reason: null,
      })
      return
    }

    respond(response, 201, {
      id: bankLinkId,
      status: "otp_required",
      bank_code: input.bank_code,
      account_number_last4: accountNumberLast4,
      resolved_account_name: "Journey Test",
      funding_connection_id: null,
      failure_reason: null,
    })
    return
  }

  if (url.pathname === `/v1/funding-connections/bank-links/${bankLinkId}/otp` && method === "POST") {
    const input = await readBody(request)
    if (input.otp !== "123456") {
      respond(response, 422, { detail: "Invalid OTP" })
      return
    }

    const connection = makeFundingConnection({
      bankCode: "044",
      accountName: "Journey Test",
      last4: "6789",
    })
    respond(response, 200, {
      id: bankLinkId,
      status: "succeeded",
      bank_code: "044",
      account_number_last4: "6789",
      resolved_account_name: connection.account_name,
      funding_connection_id: connection.id,
      failure_reason: null,
    })
    return
  }

  const fundingConnectionMatch = url.pathname.match(
    /^\/v1\/funding-connections\/([^/]+)(?:\/(revoke))?$/
  )
  if (fundingConnectionMatch) {
    const connection = fundingConnections.find(
      (item) => item.id === fundingConnectionMatch[1]
    )
    if (!connection) {
      respond(response, 404, { detail: "Funding source not found" })
      return
    }

    if (fundingConnectionMatch[2] === "revoke" && method === "POST") {
      connection.status = "revoked"
      connection.is_default = false
      connection.revoked_at = new Date().toISOString()
      connection.updated_at = connection.revoked_at
      response.writeHead(204)
      response.end()
      return
    }

    if (!fundingConnectionMatch[2] && method === "PATCH") {
      const input = await readBody(request)
      for (const item of fundingConnections) item.is_default = false
      connection.is_default = input.is_default
      connection.updated_at = new Date().toISOString()
      respond(response, 200, connection)
      return
    }
  }

  if (url.pathname === "/v1/analytics/overview") {
    respond(response, 200, {
      generated_at: new Date().toISOString(),
      categories: 0,
      active_categories: 0,
      azas: 0,
      total_allocated_per_run: "0.00",
      total_executed: "0.00",
      total_fees: "0.00",
      total_saved: "0.00",
      total_returns: "0.00",
      open_reconciliation_events: 0,
      failed_executions: 0,
    })
    return
  }

  if (url.pathname === "/v1/flows/me") {
    respond(response, 200, {
      id: "3eb05c38-a2ac-4e72-b32e-111f7a28a022",
      name: "Flow",
      description: null,
      currency: "NGN",
      status: "active",
      default_funding_connection_id: null,
      has_funding: false,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    })
    return
  }

  if (url.pathname === "/v1/categories") {
    respond(response, 200, [])
    return
  }

  if (url.pathname === "/v1/audit/events") {
    respond(response, 200, { total: 0, rows: [] })
    return
  }

  respond(response, 404, { detail: "Not found" })
})

server.listen(3101, "127.0.0.1")
