import { expect, test } from "@playwright/test"

test("a visitor can move between sign-in and sign-up", async ({ page }) => {
  await page.goto("/login")
  const skipLink = page.getByRole("link", { name: "Skip to main content" })
  await page.keyboard.press("Tab")
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/login#main-content$/)
  await expect(page.locator("#main-content")).toBeFocused()

  await expect(
    page.getByRole("heading", { name: "Sign in to AzaPay" })
  ).toBeVisible()

  await page.getByRole("link", { name: "Create an account" }).click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible()
  await expect(page.getByRole("textbox", { name: "Full name" })).toBeVisible()

  await page.getByRole("link", { name: "Sign in" }).click()
  await expect(
    page.getByRole("heading", { name: "Sign in to AzaPay" })
  ).toBeVisible()
})
