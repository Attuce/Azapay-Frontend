import { run } from "effection"
import { expect, test } from "vitest"
import { ServerConfigContext, type ServerConfig } from "./config"
import { sealSession, unsealSession } from "./session"

const tokens = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_at: "2099-01-01T00:00:00Z",
  refresh_expires_at: "2099-02-01T00:00:00Z",
}

const config: ServerConfig = {
  apiUrl: "https://api.example.test",
  sessionKey: Buffer.alloc(32, 7),
  secureCookies: true,
}

test("session contents are encrypted and tampering invalidates the cookie", async () => {
  const result = await run(function* () {
    yield* ServerConfigContext.set(config)
    const sealed = yield* sealSession(tokens)
    return {
      sealed,
      decrypted: yield* unsealSession(sealed!),
      tampered: yield* unsealSession(`${sealed}a`),
    }
  })
  const { sealed, decrypted, tampered } = result
  expect(sealed).not.toBeNull()
  expect(sealed).not.toContain("access-token")
  expect(decrypted).toEqual(tokens)
  expect(tampered).toBeNull()
})

test("a different scope cannot decrypt another scope's session", async () => {
  const sealed = await run(function* () {
    yield* ServerConfigContext.set(config)
    return yield* sealSession(tokens)
  })
  const otherConfig = { ...config, sessionKey: Buffer.alloc(32, 8) }
  const decrypted = await run(function* () {
    yield* ServerConfigContext.set(otherConfig)
    return yield* unsealSession(sealed!)
  })
  expect(decrypted).toBeNull()
})
