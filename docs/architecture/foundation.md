# Application foundation

The runtime foundation is in `apps/web/src/application`. It is independent of
React screens and Next.js route handlers. Feature modules use Jamx's own
composable capabilities through Effection context.

## Contracts

- `Outcome<T>` is `Either<AppError, T>` and `UseCase<T>` is
  `Operation<Outcome<T>>`.
- `HttpContext` holds a Jamx `ExecutableHandler` and `LoggerContext` holds a
  Jamx `Logger`. An entry point composes and supplies them within one request
  or browser workflow scope; no mutable per-user state belongs in a global
  context. A missing required handler fails the Effection operation as a wiring
  error.
- `ServerConfigContext` carries the API URL, session encryption key, and cookie
  security setting. Only the server entry point reads deployment environment
  variables. Session operations read configuration from their Effection scope;
  tests inject values through that context.
- A Next.js request or action calls `run` once. It uses `Context.set` to supply
  capabilities to that scope, then
  composes session and feature operations with `yield*` inside that scope.
- Protected pages live in Next.js's `(authenticated)` route group, which keeps
  their public URLs unchanged. Its layout provides an early missing-session
  redirect, while pages and server actions independently call the shared
  session operations at their own backend-data and mutation boundaries.
- `requirePageSession` runs first within a protected page's one Effection
  scope. It redirects missing or expired sessions and returns the access token
  for that page's specific backend read.
- Server actions create their own scopes and may reject at their configuration
  or authentication boundary. Their feature operations still return `Either`;
  the actions do not retry mutations. See ADR 0009.

## API boundary

Each feature operation uses the injected Jamx handler directly. Authenticated
entry points compose that handler with Jamx's `withAuth` interceptor after
placing the access token in their request-scoped Effection context. The feature
defines Zod schemas for the AzaPay operations it needs, validates outgoing
payloads and incoming responses with `safeParse`, passes its Effection abort
signal to Jamx, and returns an fp-ts `Either` outcome. Those schemas follow the
published OpenAPI contract and preserve its two-decimal money strings. There
is no generic request operation or frontend transport adapter.

Inside the request scope, `createServerHttp` reads `ServerConfigContext` and
composes Jamx's base URL and timeout interceptors. The entry point injects the
returned Jamx handler directly. This operation only centralizes composition;
it does not wrap requests or results.
Retry and cache interceptors are opt-in; money-moving writes must not be
automatically replayed. Tests for actual feature operations can inject a Jamx
handler built with a fake fetch implementation.

The Next.js BFF and session boundary are accepted in
[ADR 0004](decisions/0004-nextjs-bff.md). The first feature uses server actions
as entry points and an encrypted HttpOnly cookie for the backend token pair.
Token refresh and money-moving operations are later stages.
