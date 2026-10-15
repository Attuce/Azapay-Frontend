# Implementation stages

The [OpenAPI contract](https://azapay.onrender.com/openapi.json) supplies the endpoint shapes and backend-owned financial state. Build each stage as a customer journey with its Effection operations, Zod schemas, screens, and focused tests. Recheck the live contract before starting a stage.

| Stage | Customer journey                                                               | Status      |
| ----- | ------------------------------------------------------------------------------ | ----------- |
| 1     | Register, sign in, view current account details, sign out                      | Implemented |
| 2     | Refresh expiring sessions; profile and account settings                        | Implemented |
| 3     | Read the backend's overview, Flow, categories, and activity                    | Implemented |
| 4     | Connect funding sources and handle provider steps                              | Implemented |
| 5     | Create and manage Flow spending and saving instructions                        | Implemented |
| 6     | Create and manage Azas, invitations, contributions, and withdrawals            | Implemented |
| 7     | Complete settings, consent, deactivation, accessibility, and journey hardening | Implemented |

Stage 1 uses `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me`, and `/v1/auth/logout`. Session tokens stay in an encrypted HttpOnly cookie. A backend logout call is attempted while the access token is valid; the browser session is always cleared.

Stage 2 rotates expired sessions through `/v1/auth/refresh` before returning to
the requested local page. Profile and preference screens use `/v1/users/me` and
`/v1/settings`; updates remain contract-validated server actions.

Stage 3 renders `/v1/analytics/overview`, `/v1/flows/me`, `/v1/categories`,
and `/v1/audit/events` as a read-only customer dashboard. It preserves the API
money strings and does not derive balances, fees, execution, or settlement state.

Financial stages must display amounts and outcomes supplied by the API. No balance, fee, or settlement state is inferred in the frontend.

Stage 4 supports bank discovery, account resolution and bank-link verification
through either the provider's immediate-success response or its OTP step. It
shows connected sources using only masked account digits, supports backend
default-source updates and revocation, and reports failed OTP attempts without
claiming verification succeeded. The inspected API has no card-authorization
start endpoint; card connections are not offered without a provider flow.

Stage 5 supports Flow settings and category lifecycle, payment and savings
instruction creation, amount and schedule edits, destination updates while
backend state allows them, payment activation/pause, savings pause/resume,
funding-source selection, API bank and existing-Aza selection, upcoming-run
readiness, and the historical run timeline. The backend owns category
conservation, readiness, fees, settlement, and recovery outcomes. Full destination
account numbers are removed on the server before payment or run-history data is
sent to client components. Savings instructions can target existing Azas; Aza
creation and lifecycle remain Stage 6.

Stage 6 now provides Aza list, creation, detail, metadata edits, invitation
acceptance and revocation, bank-funded contribution requests, withdrawal quotes,
bank destination confirmation, cancellation, matured release requests, and
backend-gated closure. It renders the backend's balances, withdrawal fees, net
amounts, availability times, and statuses. Contribution creation is presented as
an instruction rather than settlement. Full withdrawal account numbers,
idempotency keys, and transaction references are removed before data reaches
client components. The provider bank identifier required for payout confirmation
has no lookup operation in the inspected API contract, so the confirmation form
asks the customer to supply the identifier. Direct Aza-to-Aza transfers are not
offered because the API contract does not support them.

Stage 7 adds consent-version reads and acceptance, plus account deactivation
with explicit typed confirmation and local session removal after the API's
successful 204 response. Consent acceptance is checked against a fresh
backend-published scope/version before it is recorded. The contract exposes
consent identifiers but not policy text. Each consent scope/version now has a
clearly labeled placeholder policy URL on `example.com`; replace those URLs
with approved policy pages before launch. Route titles and
dynamic form status announcements are in place. All routes now expose a
keyboard skip link and a focusable main landmark, keyboard focus has a shared
visible outline, and validation failures are announced as alerts while
successful updates use status announcements. The automated browser journey
verifies keyboard access to the skip link and main landmark, as well as
sign-in/sign-up navigation. An isolated mock API now supports browser review of
the authenticated settings journey, consent acceptance, account deactivation,
and the redirect for a visitor without a session. The API provides consent
scope/version identifiers but no policy text or policy URLs, so the placeholder
links are placeholders rather than final policy material and must be replaced
with approved URLs before release.
