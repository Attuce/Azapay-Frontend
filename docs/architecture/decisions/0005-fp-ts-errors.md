# ADR 0005: Use fp-ts Either for application errors

- Date: 2026-09-24
- Status: Superseded in part by ADR 0009

## Context

The application needs explicit, typed outcomes for validation, API failures,
authorization, and uncertain transaction results. Effection owns the lifetime
of asynchronous work; its thrown-error channel should not become the normal
business error channel. Jamx and third-party code may still reject or throw at
their boundaries.

## Decision

Use fp-ts `Either` for module and use-case outcomes. An asynchronous use case
has the conceptual contract `Operation<Either<AppError, Value>>`. Use `Left` for
failure and `Right` for success. Define a tagged `AppError` model that retains
meaningful categories and safe customer-facing information. Application modules
do not deliberately throw or rely on exceptions for control flow.

At external boundaries, catch thrown exceptions and rejected promises and
convert them to typed `Left` values. Translate Jamx's result type into this
same contract. Keep Effection halting distinct from an error outcome: stopping
an operation cleans up local work and must not imply that a backend-accepted
financial instruction was cancelled. The fp-ts
[`Either` documentation](https://gcanti.github.io/fp-ts/modules/Either.ts.html)
describes the `Left`/`Right` model and interop helpers.

## Consequences

- Callers must handle both outcomes explicitly, including at React and Next.js
  entry points.
- The feature modules use Effection operations plus fp-ts `Either`; they do not
  introduce a second async model such as `TaskEither` for the same workflow.
- Feature operation tests cover HTTP error mapping, rejected promises,
  unexpected exceptions, and cleanup on halt where those cases apply.
- Logging may record diagnostic detail, but `AppError` sent to a browser must
  not expose credentials, tokens, or sensitive provider data.

## Review trigger

Review if an adopted runtime API cannot preserve cancellation and typed error
outcomes together, or if the shared error taxonomy changes.
