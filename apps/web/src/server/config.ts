import { createContext } from "effection"

/** Server-only values injected into one request or action scope. */
export interface ServerConfig {
  readonly apiUrl: string
  readonly sessionKey: Buffer
  readonly secureCookies: boolean
}

/** Deployment configuration visible to operations in the current scope. */
export const ServerConfigContext = createContext<ServerConfig>(
  "azapay.server-config"
)

/** Read deployment settings at the server entry point for context injection. */
export function loadServerConfig(): ServerConfig | null {
  const apiUrl = process.env.AZAPAY_API_URL ?? "https://azapay.onrender.com"
  const encodedKey = process.env.AZAPAY_SESSION_KEY

  if (!URL.canParse(apiUrl) || !encodedKey) return null

  const protocol = new URL(apiUrl).protocol
  if (protocol !== "http:" && protocol !== "https:") return null

  const sessionKey = Buffer.from(encodedKey, "base64")
  if (sessionKey.length !== 32) return null

  return {
    apiUrl,
    sessionKey,
    secureCookies: process.env.NODE_ENV === "production",
  }
}
