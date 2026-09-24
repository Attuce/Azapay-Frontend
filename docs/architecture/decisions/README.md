# Architecture decision records

| Record | Status | Decision |
| --- | --- | --- |
| [0001](0001-api-source-of-truth.md) | Accepted | AzaPay API defines product behaviour and financial state |
| [0002](0002-effection-backbone.md) | Accepted | Effection is the application architecture backbone |
| [0003](0003-jamx-adapters.md) | Accepted | Use Jamx for HTTP and logging adapters |
| [0004](0004-nextjs-bff.md) | Proposed | Use the Next.js runtime as a thin browser-facing API and session boundary |
| [0005](0005-fp-ts-errors.md) | Accepted | Use fp-ts Either for explicit error handling; no throw-based application flow |
| [0006](0006-zod-api-contract.md) | Accepted | Use Zod schemas for the frontend's API contract boundary |
| [0007](0007-testing-stack.md) | Accepted | Use Vitest, React Testing Library, and Playwright for frontend tests |

Records are numbered in creation order. Accepted records describe decisions
explicitly established for this project. Proposed records remain reviewable
options until accepted. To change an accepted choice, create a new record and
mark the old one superseded; do not erase the original rationale.

New records should state the date, status, context, decision, consequences,
and review triggers. Keep implementation detail in the architecture overview
or module documentation unless it is necessary to understand the decision.
