# ADR 0010: Use Clerk for identity and session lifecycle

- Date: 2026-11-05
- Status: Accepted

## Context

The live AzaPay OpenAPI contract identifies `GET /v1/auth/me` as using a
verified Clerk session. It does not define login, registration, password
recovery, token refresh, or logout endpoints. The frontend's previous custom
auth operations and encrypted backend-token cookie therefore did not match the
supported API.

## Decision

Use Clerk's Next.js SDK for sign-in, sign-up, password recovery, and browser
session lifecycle. Protect customer routes with Clerk's Next.js proxy. Resolve
the current Clerk session JWT inside a request-scoped Effection operation and
send it as a bearer token through the existing Jamx API boundary. Continue to
use `/v1/auth/me` as the source of AzaPay account data.

After AzaPay confirms account deactivation, revoke the user's active Clerk
sessions through Clerk's server SDK, then sign out the browser. This preserves
the prior sign-out-everywhere behavior across both providers.

## Consequences

- Clerk owns passwords, forgot/reset flows, browser cookies, and session token
  renewal. AzaPay-specific identity and profile data remain owned by AzaPay.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` must be supplied
  through deployment configuration. The secret key is server-only.
- Existing AzaPay users require a coordinated account import or linking plan.
  The inspected AzaPay API exposes no user export, credential transfer, or
  account-linking operation, so the frontend cannot migrate password hashes or
  reconcile identities on its own.
- The E2E-only session shortcut is enabled only by the isolated
  `AZAPAY_E2E_TEST_MODE` runtime setting and is not used in deployment.

## Review trigger

Revisit this decision if AzaPay adds first-party auth operations or changes its
Clerk session verification contract.
