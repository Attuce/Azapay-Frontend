import { defineConfig, devices } from "@playwright/test"

const baseURL = "http://127.0.0.1:3100"
const browserTestEnv = {
  ...process.env as Record<string, string>,
  AZAPAY_API_URL: "http://127.0.0.1:3101",
  AZAPAY_E2E_TEST_MODE: "true",
}

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    navigationTimeout: 60_000,
    launchOptions: process.env.PLAYWRIGHT_CHROME_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
      : undefined,
  },
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      url: "http://127.0.0.1:3101/health",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run dev -w web -- --hostname 127.0.0.1 --port 3100",
      url: `${baseURL}/login`,
      env: browserTestEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
