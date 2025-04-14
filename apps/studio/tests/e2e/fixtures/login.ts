import type { Locator, Page } from "@playwright/test"
import type { UUID } from "crypto"

import { overwriteToken } from "../utils"

export class LoginPage {
  private readonly emailInput: Locator
  private readonly otpButton: Locator
  private readonly tokenInput: Locator
  private readonly singpassButton: Locator
  private readonly singpassLoginButton: Locator
  private readonly secondaryLoginButton: Locator
  private readonly uuidInput: Locator

  constructor(public readonly page: Page) {
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
}
