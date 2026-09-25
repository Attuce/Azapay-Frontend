# ADR 0008: Inject Jamx capabilities directly

- Date: 2026-09-24
- Status: Accepted
- Supersedes: [ADR 0003](0003-jamx-adapters.md)

## Context

ADR 0003 proposed wrapping Jamx behind frontend-defined HTTP and logger
adapters. Jamx already exposes composable, injectable handlers and structured
loggers. Adding `HttpPort`, `LoggerPort`, and wrapper factories duplicates those
abstractions and makes the capability boundary harder to follow.

## Decision

Use Jamx's `ExecutableHandler` and `Logger` as the values in Effection contexts.
Compose handlers with Jamx interceptors for the entry point that owns the scope;
inject a test handler or logger through the same contexts. The server's shared
composition operation reads its base URL from Effection context and returns
Jamx's handler directly. Feature code uses
those capabilities directly where needed.

Each feature operation validates its own endpoint payloads with Zod, binds
Effection cancellation to its request, and converts Jamx's result to its
fp-ts `Either<AppError, Value>` outcome. Do not introduce a generic request
operation to repeat Jamx's API.

## Consequences

- No frontend-defined HTTP or logger port mirrors Jamx.
- Jamx retry and cache interceptors remain opt-in. Money-moving writes are not
  automatically retried or replayed.
- The context scope supplies request-specific headers and credentials without
  sharing mutable per-user state globally.
- Feature tests can inject Jamx handlers built with a fake fetch implementation.

## Review trigger

Review if Jamx's public contracts change or a feature needs a narrower
domain-specific capability that is not a restatement of Jamx's API.
