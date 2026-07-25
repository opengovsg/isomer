import { expect, test as base } from "@playwright/test"
import crypto from "crypto"

import { LoginPage } from "./fixtures/login"
import {
  ensureUserOnboarded,
  insertUserWithoutSites,
  resetUserSingpassState,
  setUserSingpassUuid,
} from "./fixtures/user"

interface LoginPageFixture {
  loginPage: LoginPage
}
const test = base.extend<LoginPageFixture>({
  loginPage: async ({ page }, fixture) => {
    const loginPage = new LoginPage(page)
    await fixture(loginPage)
  },
})

test.skip("first login with singpass should succeed", async ({ loginPage }) => {
  // Arrange
  const editorEmail = "editor@open.gov.sg"
  await resetUserSingpassState(editorEmail)
  await loginPage.gotoSignIn()

  // Act
  await loginPage.fillEmail(editorEmail)
  await loginPage.expectOtpVisible()
  await loginPage.fillToken(editorEmail)
  await loginPage.signInButton().click()
  await loginPage.defaultMockpassLogin()
  await loginPage.clickContinueToStudio()

  // Assert
  await loginPage.expectWelcomeModalVisible()
})

test.skip("logins should not succeed when the uuid is different", async ({
  loginPage,
}) => {
  // Arrange
  const editorEmail = "editor@open.gov.sg"
  await setUserSingpassUuid(editorEmail, crypto.randomUUID())
  await loginPage.gotoSignIn()

  // Act
  await loginPage.fillEmail(editorEmail)
  await loginPage.expectOtpVisible()
  await loginPage.fillToken(editorEmail)
  await loginPage.signInButton().click()
  await loginPage.mockpassLoginWith()

  // Assert
  await loginPage.waitForSingpassErrorUrl()
  await expect(loginPage.singpassButton).toBeVisible()
})

test.skip("subsequent login should succeed when the uuid matches", async ({
  loginPage,
}) => {
  // Arrange
  const uuid = crypto.randomUUID()
  const editorEmail = "editor@open.gov.sg"
  await setUserSingpassUuid(editorEmail, uuid)
  await ensureUserOnboarded(editorEmail)
  await loginPage.gotoSignIn()

  // Act
  await loginPage.fillEmail(editorEmail)
  await loginPage.expectOtpVisible()
  await loginPage.fillToken(editorEmail)
  await loginPage.signInButton().click()
  await loginPage.mockpassLoginWith(uuid)
  await loginPage.waitForAppHomeUrl()

  // Assert
  await loginPage.expectSitesHeadingVisible()
})

test.skip("user should still be allowed to login even when there are no sites tied to them", async ({
  loginPage,
}) => {
  // Arrange
  const email = `${crypto.randomUUID()}@open.gov.sg`
  await insertUserWithoutSites(email)
  await loginPage.gotoSignIn()

  // Act
  await loginPage.fillEmail(email)
  await loginPage.expectOtpVisible()
  await loginPage.fillToken(email)
  await loginPage.signInButton().click()
  await loginPage.defaultMockpassLogin()
  await loginPage.clickContinueToStudio()

  // Assert
  await loginPage.expectWelcomeModalVisible()
  await loginPage.expectNoSitesAccessTextVisible()
})
