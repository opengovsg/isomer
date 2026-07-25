import type { UUID } from "crypto"
import { expect, type Locator, type Page } from "@playwright/test"
import { env } from "~/env.mjs"
import { overwriteToken } from "~e2e/utils"

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly otpButton: Locator
  readonly tokenInput: Locator
  readonly singpassButton: Locator
  readonly singpassLoginButton: Locator
  readonly secondaryLoginButton: Locator
  readonly uuidInput: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByRole("textbox", { name: "email" })
    this.otpButton = page.getByRole("button", {
      name: "send one-time password",
    })
    this.tokenInput = page.getByRole("textbox")
    this.singpassButton = page.getByLabel("Authenticate with Singpass")
    this.singpassLoginButton = page.getByRole("button", { name: "Login" })
    this.secondaryLoginButton = page.locator("#sectionA").getByText("Login")
    this.uuidInput = page.getByRole("textbox", { name: "uuid" })
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
    await this.otpButton.click()
  }

  async fillToken(email: string) {
    // NOTE: The function for verification of otp does a comparison between the hash of the submitted token
    // and the VerificationToken.token in db.
    const token = await overwriteToken({
      factory: () => "123456",
      identifier: email,
    })
    await this.tokenInput.fill(token)
  }

  // NOTE: Handles login at the mockpass page and redirects to studio
  async defaultMockpassLogin() {
    await this.singpassButton.click()
    await this.singpassLoginButton.click()
    // NOTE: There are 2 login buttons on mockpass -
    // the first button, once clicked, brings you to a second profile selection component
    // that also has a login button.
    // Both of the buttons have the same `name` for `getByRole`, so we have to use a new locator
    // that doesn't conflict with the original button's locator.
    await this.secondaryLoginButton.click()
  }

  async mockpassLoginWith(uuid?: UUID) {
    await this.singpassButton.click()
    await this.singpassLoginButton.click()
    // NOTE: There are 2 login buttons on mockpass -
    // the first button, once clicked, brings you to a second profile selection component
    // that also has a login button.
    // Both of the buttons have the same `name` for `getByRole`, so we have to use a new locator
    // that doesn't conflict with the original button's locator.
    const filledUuid = uuid || crypto.randomUUID()
    await this.uuidInput.fill(filledUuid)
    await this.secondaryLoginButton.click()
  }

  async gotoSignIn() {
    await this.page.goto("/sign-in")
  }

  async gotoNotFound() {
    return this.page.goto("/not-found")
  }

  studioTitle() {
    return this.page.getByText("Isomer Studio").first()
  }

  async expectStudioTitleVisible() {
    await expect(this.studioTitle()).toBeVisible()
  }

  signInButton() {
    return this.page.getByRole("button", { name: "Sign in" })
  }

  async expectOtpVisible() {
    await expect(this.page.getByText("Enter OTP")).toBeVisible()
  }

  continueToStudioLink() {
    return this.page.getByRole("link", {
      name: "Continue to Isomer Studio",
    })
  }

  async clickContinueToStudio() {
    await expect(this.continueToStudioLink()).toBeVisible()
    await this.continueToStudioLink().click()
  }

  welcomeModal() {
    return this.page.getByRole("dialog", { name: "Welcome to Studio" })
  }

  async expectWelcomeModalVisible() {
    await expect(this.welcomeModal()).toBeVisible()
  }

  async expectSitesHeadingVisible() {
    await expect(
      this.page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
  }

  async expectNoSitesAccessTextVisible() {
    await expect(
      this.page.getByText("You don't have access to any sites yet."),
    ).toBeInViewport()
  }

  async waitForSingpassErrorUrl() {
    await this.page.waitForURL("**/singpass?error=true")
  }

  async waitForAppHomeUrl() {
    await this.page.waitForURL(env.NEXT_PUBLIC_APP_URL!)
  }
}
