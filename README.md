# AzaPay frontend

The customer web app lives in `apps/web`. The [AzaPay OpenAPI contract](https://azapay.onrender.com/openapi.json) defines backend behaviour and financial state.

## Run locally

Use Node 25. Install dependencies with `npm install`, then copy `.env.example` to `apps/web/.env.local`. Set `AZAPAY_SESSION_KEY` to a fresh 32-byte key from `openssl rand -base64 32`. `AZAPAY_API_URL` defaults to `https://azapay.onrender.com`. Run `npm run dev`.

The first implemented stage covers registration, sign-in, current account details, and sign-out. Tokens are stored in an encrypted HttpOnly cookie, so browser JavaScript does not receive them. Token refresh is not implemented yet; an expired access token requires signing in again.

## Architecture and checks

The working design and decisions are in [docs/architecture](docs/architecture/README.md). Run `npm run lint`, `npm run typecheck`, and `npm test` before completing code changes. Run `npm run test:e2e` for browser journeys. The browser command starts the web app on port 3100; install Chromium once with `npx playwright install chromium` or set `PLAYWRIGHT_CHROME_PATH` to a local Chrome executable.

The [implementation stages](docs/implementation-stages.md) record the completed first slice and the planned feature order.
