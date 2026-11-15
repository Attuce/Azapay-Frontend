# AzaPay frontend

The customer web app lives in `apps/web`. The [AzaPay OpenAPI contract](https://azapay.onrender.com/openapi.json) defines backend behaviour and financial state.

## Run locally

Use Node 25. Install dependencies with `npm install`, then copy `.env.example` to `apps/web/.env.local` and set the Clerk publishable and secret keys for the configured Clerk instance. `AZAPAY_API_URL` defaults to `https://azapay.onrender.com`. Clerk manages sign-in, sign-up, password recovery, and browser sessions; the app sends its short-lived session token to AzaPay for `/v1/auth/me` and feature requests. Run `npm run dev`.

Clerk handles registration, sign-in, forgot/reset password, and session lifecycle. AzaPay's `/v1/auth/me` endpoint resolves the account associated with the Clerk session token. Existing account records require a coordinated Clerk import or linking process before production rollout; the exposed AzaPay API does not provide user export or identity-linking endpoints.

## Architecture and checks

The working design and decisions are in [docs/architecture](docs/architecture/README.md). Run `npm run lint`, `npm run typecheck`, and `npm test` before completing code changes. Run `npm run test:e2e` for browser journeys. The browser command starts the web app on port 3100; install Chromium once with `npx playwright install chromium` or set `PLAYWRIGHT_CHROME_PATH` to a local Chrome executable.

The [implementation stages](docs/implementation-stages.md) record the completed first slice and the planned feature order.
