import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import LoginTab from "./LoginTab"

test("sample credentials populate the sign-in form", () => {
  render(<LoginTab onAuthenticated={() => {}} initialTab="signin" />)

  fireEvent.click(screen.getByRole("button", { name: "Use sample data" }))

  expect((screen.getByPlaceholderText("Email") as HTMLInputElement).value).toMatch(/@/)
  expect(screen.getByPlaceholderText("Password")).not.toHaveValue("")
})
