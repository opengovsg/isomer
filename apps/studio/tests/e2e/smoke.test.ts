import { expect, test } from "@playwright/test"
import { LoginPage } from "~e2e/fixtures/login"

test("go to /sign-in", async ({ page }) => {
  const loginPage = new LoginPage(page)

  // Act
  await loginPage.gotoSignIn()

  // Assert
  await loginPage.expectStudioTitleVisible()
})

test("test 404", async ({ page }) => {
  const loginPage = new LoginPage(page)

  // Act
  const res = await loginPage.gotoNotFound()

  // Assert
  expect(res?.status()).toBe(404)
})
