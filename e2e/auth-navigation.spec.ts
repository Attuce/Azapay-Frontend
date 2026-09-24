import { expect, test } from "@playwright/test"

test("a visitor can move between sign-in and sign-up", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible()

  await page.getByRole("button", { name: "Create one" }).click()
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible()

  await page.getByRole("button", { name: "Log in here" }).click()
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible()
})
