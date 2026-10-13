import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS } from "~e2e/fixtures/auth"
import { LoginPage } from "~e2e/fixtures/login"
import { setSingpassUuidFor } from "~e2e/fixtures/session-mint"

test("email OTP + Singpass + Mockpass signs in editor", async ({ page }) => {
  // Arrange
  const email = TEST_EMAILS.editor
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)
  const loginPage = new LoginPage(page)

  // Act
  await loginPage.gotoSignIn()
  await loginPage.fillEmail(email)
  await loginPage.expectOtpVisible()
  await loginPage.fillToken(email)
  await loginPage.clickSignInAfterOtp()
  await loginPage.expectOnSingpassLinkingStep()
  await loginPage.mockpassLoginWith(uuid)

  // Assert
  await loginPage.expectAppRootUrl()
  await loginPage.expectSitesHeadingVisible()
})
