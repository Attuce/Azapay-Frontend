<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AzaPay frontend architecture

Read [`docs/architecture/README.md`](docs/architecture/README.md) and the
[decision records](docs/architecture/decisions/README.md) before changing
application behaviour or module boundaries. Update the overview and add or
supersede a decision record when a consequential architecture choice changes.
The shared runtime contracts are described in
[`docs/architecture/foundation.md`](docs/architecture/foundation.md).

- The [AzaPay OpenAPI contract](https://azapay.onrender.com/openapi.json) is the
  source of truth for supported actions and financial state. Do not calculate
  balances, fees, settlement outcomes, or readiness in the frontend. Preserve
  money values as strings with exactly two decimal places, as specified by the
  API; do not convert them to floating-point numbers.
- Define Zod schemas for the API operations each module uses, aligned with the
  OpenAPI contract. Infer TypeScript types from those schemas. Validate request
  payloads and external responses at the API contract boundary with `safeParse`;
  map validation failures to typed `Left` values without exposing sensitive
  payloads in logs or browser errors.
- Effection is the application backbone. Define explicit module contracts and
  express asynchronous use cases as scoped `Operation`s. Supply capabilities
  through Effection context; never place mutable per-user state in global
  context or a process-wide singleton. Enter one Effection scope per server
  request or action, set its capabilities with `Context.set`, and compose all
  work in that scope with `yield*` rather than starting another top-level `run`.
- Read environment variables only in the server configuration loader. Inject
  runtime configuration through Effection context; tests supply their own
  context values rather than changing process-wide environment state.
- Use fp-ts `Either` for outcomes. Application use cases return
  `Operation<Either<AppError, Value>>`. Do not throw for application errors.
  Catch external exceptions and rejected promises at boundaries and convert them
  to typed `Left` values. Keep Effection cancellation distinct from failure.
- Inject Jamx's HTTP handler and logger directly through Effection context;
  do not wrap them in another port or adapter. Propagate the Effection scope's
  abort signal to network requests. Never automatically replay a money-moving
  write or log tokens, credentials, or full account numbers.
- Keep React components and Next.js entry points focused on presentation and
  adapting user requests to operations. They must not call the AzaPay API
  directly or contain financial workflow logic.
- Separate distinct steps and substantial JSX sections with blank lines. Add
  documentation comments to exported contracts and operations, and explain
  security or runtime behavior that the code alone does not make clear. Avoid
  comments that only repeat a function or variable name. A one-line guard may
  omit braces; a control statement spanning multiple lines must use braces.

Run `npm run lint`, `npm run typecheck`, and `npm test` before completing code
changes. Run `npm run test:e2e` when a browser journey changes.
ESLint enforces the no-throw rule. Treat the remaining architecture guidance as
review requirements; add targeted lint rules if recurring deviations show they
would be useful.
