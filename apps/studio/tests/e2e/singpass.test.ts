import { expect, test } from "@playwright/test"

import { overwriteToken } from "./utils"

test.only("first login with singpass", async ({ page }) => {
  // Arrange
  const editorEmail = "editor@open.gov.sg"
  await page.goto("/sign-in")
  const emailInput = page.getByRole("textbox", { name: "email" })
  const otpButton = page.getByRole("button", { name: "send one-time password" })
  const signinButton = page.getByRole("button", { name: "Sign in" })

  // Act
  await emailInput.fill(editorEmail)
  await otpButton.click()
  await expect(page.getByText("Enter OTP").first()).toBeVisible()

  // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
  // and the VerificationToken.token in db.
  const token = await overwriteToken({
    factory: () => "123456",
    identifier: editorEmail,
  })
  const tokenInput = page.getByRole("textbox")
  await tokenInput.fill(token)
  await signinButton.click()
  const singpassButton = page.getByLabel("Authenticate with Singpass")
  await singpassButton.click()
  const singpassLoginButton = page.getByRole("button", { name: "Login" })
  await singpassLoginButton.click()
  // NOTE: There are 2 login buttons on mockpass -
  // the first button, once clicked, brings you to a second profile selection component
  // that also has a login button.
  // Both of the buttons have the same `name` for `getByRole`, so we have to use a new locator
  // that doesn't conflict with the original button's locator.
  const secondaryLoginButton = page.locator("#sectionA").getByText("Login")
  await secondaryLoginButton.click()
  const continueButton = page.getByRole("link", {
    name: "Continue to Isomer Studio",
  })
  await continueButton.click()

  // Assert
  const modal = page.getByRole("dialog", { name: "Welcome to Studio" })
  await expect(modal).toBeVisible()
})
