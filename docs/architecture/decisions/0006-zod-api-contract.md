# ADR 0006: Use Zod at the API contract boundary

- Date: 2026-09-24
- Status: Accepted

## Context

The published AzaPay OpenAPI document is the source of truth, but TypeScript
types alone cannot check data received over HTTP. The frontend needs a runtime
contract for the operations it uses and an explicit outcome when a response
does not match that contract.

## Decision

Define Zod schemas for the request and response shapes of the AzaPay operations
used by each feature module. Keep them aligned with the published OpenAPI
contract; the Zod schemas do not redefine backend behaviour. Infer TypeScript
types from these schemas instead of maintaining a separate handwritten type
model for the same transport shape.

Validate outgoing payloads and incoming external responses at the API contract
boundary using `safeParse`. Map validation failures to a typed fp-ts `Left`, including an
unexpected-response error for invalid backend data. Keep the original response
out of customer-facing errors and logs. Preserve money values as two-decimal
strings without numeric coercion.

Feature operations call Jamx directly and use Zod schemas to validate API
payload shapes. [ADR 0008](0008-direct-jamx-capabilities.md) records the direct
use of Jamx capabilities.

## Consequences

- Modules receive validated transport data or an explicit error outcome.
- Contract changes require updating affected schemas, mappings, and contract
  tests against representative API payloads.
- Build schemas for used operations as features are implemented; no full API
  schema conversion is required before the first feature.
- Zod `safeParse` matches the application's no-throw error contract.

## Review trigger

Review when the OpenAPI contract changes or repeated schema drift makes
automated schema generation useful. Keep the published OpenAPI document as the
authority in either case.
