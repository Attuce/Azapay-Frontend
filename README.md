# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## AzaPay architecture

The working system design and architecture decision records are in
[`docs/architecture`](docs/architecture/README.md). The AzaPay OpenAPI contract
defines supported product behaviour and backend-owned financial state.

## Tests

Run `npm test` for Vitest unit and component tests, `npm run test:e2e` for
Playwright browser tests, and `npm run typecheck` for TypeScript checks. The
browser command starts the web app on port 3100. Install its browser once with
`npx playwright install chromium`.

On a machine with Chrome already installed, set `PLAYWRIGHT_CHROME_PATH` to its
executable path to run the browser tests without Playwright's browser download.
Operation tests should inject fake capabilities through Effection context;
adapter tests should cover Zod validation and HTTP error mapping. See
[ADR 0007](docs/architecture/decisions/0007-testing-stack.md).

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
