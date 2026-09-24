# ADR 0002: Effection is the application architecture backbone

- Date: 2026-09-24
- Status: Accepted

## Context

The application contains multi-step and concurrent journeys: authentication,
funding verification, rule creation, status refresh, and withdrawals. These need
clear contracts, dependency injection, predictable lifetimes, and cleanup.

## Decision

Feature use cases are Effection operations with explicit TypeScript module
contracts. Effection contexts inject capabilities, and scopes own each
operation's child work and cleanup. Runtime entry points adapt Next.js and React
events to these operations. Server request scopes isolate per-user session and
other mutable context. Browser scopes own the lifetime of interactive journeys.
Operation outcomes use fp-ts `Either` as described in
[ADR 0005](0005-fp-ts-errors.md); Effection remains responsible for the
asynchronous lifetime.

Use stable Effection v4 context and scope APIs described in the
[context](https://frontside.com/effection/guides/v4/context/) and
[scope](https://frontside.com/effection/guides/v4/scope/) guides.

## Consequences

- Business workflows live in operations, not in route handlers or components.
- Tests provide replacement capabilities through context rather than patching
  global services.
- Promise-based adapters must propagate Effection cancellation into their
  underlying work, such as through `AbortSignal`.
- Ending a local operation is a cleanup action, not a claim that an accepted
  financial instruction was undone.

## Review trigger

Review if the Effection runtime or a target deployment cannot support the
required scope lifetime.
