import crypto from "crypto"
import { test as base, expect } from "@playwright/test"

import { db } from "~/server/modules/database"
import { LoginPage } from "./fixtures/login"

base.beforeEach(async () => {
  await db
    .updateTable("User")
    .set({
      name: "",
      phone: "",
      uuid: null,
    })
    .where((eb) =>
      eb("name", "!=", "").or("phone", "!=", "").or("uuid", "is not", null),
    )
    .execute()
})

interface LoginPageFixture {
  loginPage: LoginPage
}
const test = base.extend<LoginPageFixture>({
  loginPage: async ({ page }, useFixture) => {
    const loginPage = new LoginPage(page)
    await useFixture(loginPage)
  },
})

test("first login with singpass should succeed", async ({
  page,
  loginPage,
}) => {
  // Arrange
  const editorEmail = "editor@open.gov.sg"
  await page.goto("/sign-in")
  const signinButton = page.getByRole("button", { name: "Sign in" })

  // Act
  await loginPage.fillEmail(editorEmail)
  await expect(page.getByText("Enter OTP").first()).toBeVisible()

  // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
  // and the VerificationToken.token in db.
  await loginPage.fillToken(editorEmail)
  await signinButton.click()

  await loginPage.defaultMockpassLogin()
  const continueButton = page.getByRole("link", {
    name: "Continue to Isomer Studio",
  })
  await continueButton.click()

  // Assert
  const modal = page.getByRole("dialog", { name: "Welcome to Studio" })
  await expect(modal).toBeVisible()
})

test("logins should not succeed when the uuid is different", async ({
  page,
  loginPage,
}) => {
  // Arrange
  const editorEmail = "editor@open.gov.sg"
  await db
    .updateTable("User")
    .set({
      uuid: crypto.randomUUID(),
    })
    .where("email", "=", editorEmail)
    .execute()
  await page.goto("/sign-in")
  const signinButton = page.getByRole("button", { name: "Sign in" })

  // Act
  await loginPage.fillEmail(editorEmail)
  await expect(page.getByText("Enter OTP").first()).toBeVisible()

  // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
  // and the VerificationToken.token in db.
  await loginPage.fillToken(editorEmail)
  await signinButton.click()

  await loginPage.mockpassLoginWith()

  // Assert
  await expect(
    page.getByText("Singpass profile does not match user"),
  ).toBeVisible()
})

test("subsequent login should succeed when the uuid matches", async ({
  page,
  loginPage,
}) => {
  // Arrange
  const uuid = crypto.randomUUID()
  const editorEmail = "editor@open.gov.sg"
  await db
    .updateTable("User")
    .set({
      uuid,
    })
    .where("email", "=", editorEmail)
    .execute()
  await page.goto("/sign-in")
  const signinButton = page.getByRole("button", { name: "Sign in" })

  // Act
  await loginPage.fillEmail(editorEmail)
  await expect(page.getByText("Enter OTP").first()).toBeVisible()

  // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
  // and the VerificationToken.token in db.
  await loginPage.fillToken(editorEmail)
  await signinButton.click()

  await loginPage.mockpassLoginWith(uuid)

  // Assert
  const modal = page.getByRole("dialog", { name: "Welcome to Studio" })
  await expect(modal).toBeVisible()
})

test("user should still be allowed to login even when there are no sites tied to them", async ({
  page,
  loginPage,
}) => {
  // Arrange
  // NOTE: no site permissions - user is not tied to any site
  const email = "e2e@open.gov.sg"
  await db
    .insertInto("User")
    .values({ email, id: "e2e", name: "", phone: "" })
    .execute()
  await page.goto("/sign-in")
  const signinButton = page.getByRole("button", { name: "Sign in" })

  // Act
  await loginPage.fillEmail(email)
  await expect(page.getByText("Enter OTP").first()).toBeVisible()

  // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
  // and the VerificationToken.token in db.
  await loginPage.fillToken(email)
  await signinButton.click()

  await loginPage.defaultMockpassLogin()
  const continueButton = page.getByRole("link", {
    name: "Continue to Isomer Studio",
  })
  await continueButton.click()

  // Assert
  const modal = page.getByRole("dialog", { name: "Welcome to Studio" })
  await expect(modal).toBeVisible()
  await expect(
    page.getByText("You don't have access to any sites yet."),
  ).toBeInViewport()
})
