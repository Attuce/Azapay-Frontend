import { expect, test } from "@playwright/test"

async function createTestAccount(page: import("@playwright/test").Page) {
  await fetch("http://127.0.0.1:3101/__test/reset", { method: "POST" })
  await page.context().addCookies([{
    name: "azapay_e2e_session",
    value: "enabled",
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }])
}

test("a customer can link, set default, and remove a bank source", async ({
  page,
}) => {
  await createTestAccount(page)
  await page.goto("/funding")

  await page.getByLabel("Bank").selectOption("044")
  await page.getByLabel("Account number").fill("0123456789")
  await page.getByRole("button", { name: "Start verification" }).click()

  await expect(
    page.getByRole("status").filter({
      hasText: "Bank verification started.",
    })
  ).toBeVisible()
  await expect(page.getByText("Account ending in 6789")).toBeVisible()

  await page.getByLabel("OTP").fill("1234")
  await page.getByRole("button", { name: "Verify OTP" }).click()
  await expect(
    page.getByRole("alert").filter({
      hasText: "The OTP is invalid or expired.",
    })
  ).toBeVisible()

  await page.getByLabel("OTP").fill("123456")
  await page.getByRole("button", { name: "Verify OTP" }).click()

  const sourceCard = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Connected funding sources" }) })
  await expect(
    sourceCard.getByText("Access Bank verified and connected.")
  ).toHaveCount(0)
  await expect(sourceCard.getByText("••• 6789")).toBeVisible()

  await sourceCard.getByRole("button", { name: "Make default" }).click()
  await expect(sourceCard.getByText("Default source")).toBeVisible()

  await sourceCard.getByRole("button", { name: "Remove source" }).click()
  await expect(sourceCard.getByText("revoked")).toBeVisible()
  await expect(
    sourceCard.getByRole("button", { name: "Remove source" })
  ).toHaveCount(0)
})

test("a provider can finish bank verification without an OTP step", async ({
  page,
}) => {
  await createTestAccount(page)
  await page.goto("/funding")

  await page.getByLabel("Bank").selectOption("044")
  await page.getByLabel("Account number").fill("0123450002")
  await page.getByRole("button", { name: "Start verification" }).click()

  await expect(
    page.getByRole("status").filter({
      hasText: "Bank account verified and connected.",
    })
  ).toBeVisible()
  await expect(page.getByLabel("OTP")).toHaveCount(0)
  await expect(
    page.getByText("••• 0002", { exact: false })
  ).toBeVisible()
})
