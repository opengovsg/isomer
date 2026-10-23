import { expect, test } from "@playwright/test"
import crypto from "crypto"

import { TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { setSingpassUuidFor } from "./fixtures/session-mint"

test("email OTP + Singpass + Mockpass signs in editor", async ({ page }) => {
  // Arrange
  const email = TEST_EMAILS.editor
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)
  const loginPage = new LoginPage(page)

  // Act
  await page.goto("/sign-in")
  await loginPage.fillEmail(email)
  await expect(page.getByText("Enter OTP")).toBeVisible()
  await loginPage.fillToken(email)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/sign-in\/singpass(?:\?|$)/)
  await expect(loginPage.singpassButton).toBeVisible()
  await loginPage.mockpassLoginWith(uuid)

  // Assert
  // Post-callback redirect lands on app root (`/`), not `/sign-in` or a trailing path.
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("heading", { name: "Your sites" })).toBeVisible()
})
