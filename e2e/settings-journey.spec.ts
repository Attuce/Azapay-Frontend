import { expect, test } from "@playwright/test"

test("a customer can review consent and deactivate their account", async ({
  page,
}) => {
  await fetch("http://127.0.0.1:3101/__test/reset", { method: "POST" })
  await page.context().addCookies([{
    name: "azapay_e2e_session",
    value: "enabled",
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }])
  await page.goto("/")
  await page.getByRole("link", { name: "Settings" }).click()
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()

  const policyLink = page.getByRole("link", {
    name: "Read the terms policy (placeholder link)",
  })
  await expect(policyLink).toHaveAttribute(
    "href",
    "https://example.com/policies/terms/2026-10"
  )
  await expect(policyLink).toHaveAttribute("target", "_blank")

  await page.getByRole("button", { name: "Accept current version" }).click()
  await expect(page.getByRole("status")).toHaveText("Consent recorded.")
  await expect(page.getByText("Accepted current version")).toBeVisible()

  await page.goto("/settings")
  await page.locator('input[name="confirmation"]').fill("DEACTIVATE")
  await page.getByRole("button", { name: "Deactivate account" }).click()
  await expect(page).toHaveURL(/\/login\?status=deactivated$/)
  await expect(
    page.getByRole("status").filter({
      hasText: "Your account has been deactivated and your sessions revoked.",
    })
  ).toBeVisible()

  await page.context().clearCookies()
  await page.goto("/settings")
  await expect(page).toHaveURL(/\/login$/)
})

test("settings redirects visitors without a session to sign in", async ({
  page,
}) => {
  await page.goto("/settings")

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole("heading", { name: "Sign in to AzaPay" })
  ).toBeVisible()
})
