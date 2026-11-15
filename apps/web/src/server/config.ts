import { createContext } from "effection"

/** Server-only values injected into one request or action scope. */
export interface ServerConfig {
  readonly apiUrl: string
  readonly clerkPublishableKey: string | null
  readonly clerkSecretKey: string | null
  readonly e2eTestMode: boolean
}

/** Deployment configuration visible to operations in the current scope. */
export const ServerConfigContext = createContext<ServerConfig>(
  "azapay.server-config"
)

/** Read API and Clerk deployment settings for request-scoped context injection. */
export function loadServerConfig(): ServerConfig | null {
  const apiUrl = process.env.AZAPAY_API_URL ?? "https://azapay.onrender.com"
  if (!URL.canParse(apiUrl)) return null

  const protocol = new URL(apiUrl).protocol
  if (protocol !== "http:" && protocol !== "https:") return null

  return {
    apiUrl,
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null,
    clerkSecretKey: process.env.CLERK_SECRET_KEY ?? null,
    e2eTestMode: process.env.AZAPAY_E2E_TEST_MODE === "true",
  }
}
