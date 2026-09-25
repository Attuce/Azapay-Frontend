# ADR 0007: Test operations, components, and browser journeys

- Date: 2026-09-24
- Status: Accepted

## Context

The frontend needs checks for scoped Effection operations, Zod API contracts,
interactive React components, and complete browser journeys. The repository
previously had lint and typecheck commands but no test runner or browser tests.

## Decision

Use Vitest for module and contract tests. Supply fake capabilities through
Effection context to test outcomes and cancellation without network requests.
Use React Testing Library for interactive components and Playwright for a small
set of complete browser journeys. Test asynchronous Server Components through
browser journeys where unit tools do not support their runtime behavior.

Run unit and component tests with `npm test`; run browser tests with
`npm run test:e2e`. Keep representative API payloads in contract tests, including
invalid Zod responses and uncertain money-moving writes. Add browser coverage
for implemented customer journeys as they become available.

## Consequences

- The test runner, browser runner, and their scripts are part of the repository.
- Tests focus on externally visible behavior and module contracts rather than
  implementation details or broad snapshots.
- Browser tests start a local Next.js server and require a Chromium-compatible
  browser.

## Review trigger

Review if testing needs exceed these tools or if a platform feature cannot be
tested reliably with the chosen runner.
