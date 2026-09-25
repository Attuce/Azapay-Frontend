# ADR 0003: Use Jamx for HTTP and logging adapters

- Date: 2026-09-24
- Status: Superseded by [ADR 0008](0008-direct-jamx-capabilities.md)

## Context

The application needs consistent requests to the AzaPay API and structured
diagnostics. The selected [Jamx repository](https://github.com/joshamaju/jamx)
provides `@jamx/http` and `@jamx/logger`.

## Decision

Use `@jamx/http` behind feature module API contracts for request composition,
decoding, validation, and result mapping. Use `@jamx/logger` as the logging
capability supplied to Effection operations, with sensitive fields redacted.
Keep Jamx at the adapter boundary: feature operations depend on their contracts,
not on transport-specific response types. Normalize Jamx results and external
exceptions into the fp-ts `Either` contract in
[ADR 0005](0005-fp-ts-errors.md).

## Consequences

- HTTP policy is configured once and reused across modules.
- Jamx requests receive a scope-bound abort signal when run by Effection.
- Automatic retries remain limited to safe, idempotent requests; money-moving
  writes are not replayed merely because a response was lost.
- Logs must omit credentials, tokens, full account numbers, and other sensitive
  financial or identity data.

## Review trigger

Review if Jamx package APIs change or a required runtime cannot support an
adapter capability.
