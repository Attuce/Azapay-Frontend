# Implementation stages

The [OpenAPI contract](https://azapay.onrender.com/openapi.json) supplies the endpoint shapes and backend-owned financial state. Build each stage as a customer journey with its Effection operations, Zod schemas, screens, and focused tests. Recheck the live contract before starting a stage.

| Stage | Customer journey                                                               | Status      |
| ----- | ------------------------------------------------------------------------------ | ----------- |
| 1     | Register, sign in, view current account details, sign out                      | Implemented |
| 2     | Refresh expiring sessions; profile and account settings                        | Implemented |
| 3     | Read the backend's overview, Flow, categories, and activity                    | Implemented |
| 4     | Connect funding sources and handle provider steps                              | In progress |
| 5     | Create and manage Flow spending and saving instructions                        | Planned     |
| 6     | Create and manage Azas, invitations, contributions, and withdrawals            | Planned     |
| 7     | Complete settings, consent, deactivation, accessibility, and journey hardening | Planned     |

Stage 1 uses `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me`, and `/v1/auth/logout`. Session tokens stay in an encrypted HttpOnly cookie. A backend logout call is attempted while the access token is valid; the browser session is always cleared.

Stage 2 rotates expired sessions through `/v1/auth/refresh` before returning to
the requested local page. Profile and preference screens use `/v1/users/me` and
`/v1/settings`; updates remain contract-validated server actions.

Stage 3 renders `/v1/analytics/overview`, `/v1/flows/me`, `/v1/categories`,
and `/v1/audit/events` as a read-only customer dashboard. It preserves the API
money strings and does not derive balances, fees, execution, or settlement state.

Financial stages must display amounts and outcomes supplied by the API. No balance, fee, or settlement state is inferred in the frontend.
