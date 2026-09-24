# ADR 0004: Use Next.js as a thin backend for the frontend

- Date: 2026-09-24
- Status: Proposed

## Context

The AzaPay API returns bearer access and refresh tokens. A browser-only client
would need to manage these tokens directly. The current web project has a
Next.js runtime capable of holding a browser-facing session and calling the
AzaPay API.

## Proposed decision

Use the Next.js runtime as the browser-facing session and API boundary. The
browser calls same-origin frontend endpoints for interactive authenticated
requests. Server-rendered reads call the AzaPay API directly through the
server adapter, avoiding a call back into the application's own HTTP endpoint.
The BFF authenticates and forwards requests but does not own financial rules or
settlement state. Partner webhooks continue to target the AzaPay backend.

This follows the [Next.js BFF guidance](https://nextjs.org/docs/app/guides/backend-for-frontend)
and its [authentication guidance](https://nextjs.org/docs/app/guides/authentication).

## Consequences

- Access and refresh tokens can remain outside browser JavaScript.
- The BFF needs session storage or protected session cookies, refresh handling,
  and protection for cookie-authenticated writes.
- Browser requests have an additional network hop; server-rendered reads do not
  need to call a same-origin route handler.
- Effection remains the application backbone on both sides of the runtime
  boundary; the BFF is an entry point and adapter.

## Review trigger

Accept, revise, or reject this record before implementing session management.
