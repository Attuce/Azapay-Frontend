# ADR 0009: Permit throws at Next.js server-action boundaries

- Date: 2026-09-25
- Status: Accepted

## Context

Feature operations use `Either` so callers can handle expected validation,
transport, API, and financial-workflow outcomes explicitly. A Next.js server
action is also a framework boundary, however: the framework can transport a
rejected action to its error handling path without exposing its error details
to the browser. Returning a separate typed value for failed configuration or a
missing authenticated session made every action repeat boundary-state mapping.

## Decision

Server actions may throw only when their server configuration is unavailable or
when no usable authenticated session can be established, including after a
token-refresh attempt. These errors use generic messages and must not include
tokens, credentials, account numbers, or backend response bodies.

Feature operations, session encryption operations, and all other application
logic continue to return typed `Either` outcomes. Actions still validate their
untrusted input and map feature-operation `Left` values to deliberate
customer-facing results. A money-moving mutation must never be automatically
retried following either an `Either` failure or a thrown action-boundary error.

## Consequences

- Server actions own their Effection scope and may let the specified boundary
  errors reject through Next.js.
- ESLint permits `ThrowStatement` only in `app/**/actions.ts`; it continues to
  reject deliberate throws in feature and shared application code.
- Action error boundaries must present a safe recovery route without rendering
  thrown details.

## Review trigger

Review if Next.js action error handling would disclose thrown messages, if more
than configuration and authenticated-session failures need exceptions, or if a
future action requires a typed recovery state instead.
